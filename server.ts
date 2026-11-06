import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import prisma from "./backend/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track online users: userId -> socketId[]
  const userSockets = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    let currentUserId: string | null = null;

    socket.on("authenticate", async (userId: string) => {
      currentUserId = userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // Update online status in DB
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeenAt: new Date() },
      }).catch(() => {});

      io.emit("user_presence", { userId, isOnline: true });
    });

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on("typing_start", ({ conversationId, username }: { conversationId: string; username: string }) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        username,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, username }: { conversationId: string; username: string }) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        username,
        isTyping: false,
      });
    });

    socket.on("send_message", async (data: {
      conversationId: string;
      senderId: string;
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      try {
        const { conversationId, senderId, content, attachmentUrl, attachmentType } = data;

        // Verify sender is active and not banned
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
        });

        if (!sender || sender.status === "BANNED" || sender.status === "MUTED") {
          socket.emit("error", { message: "You are not authorized to post messages." });
          return;
        }

        // Verify conversation membership
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: senderId,
            },
          },
        });

        if (!member) {
          socket.emit("error", { message: "You are not a member of this conversation." });
          return;
        }

        // Restrict messaging to Player <-> Admin only
        const convMembers = await prisma.conversationMember.findMany({
          where: { conversationId },
          include: { user: { select: { role: true, email: true } } },
        });

        const hasAdmin = convMembers.some(
          (m) => m.user.role === "ADMIN" || m.user.email === "admin@kali-gaming.com"
        );
        if (!hasAdmin && sender.role !== "ADMIN") {
          socket.emit("error", {
            message: "Chat is strictly restricted to 1-on-1 communication with the Kali Platform Administrator.",
          });
          return;
        }

        // Save message to DB
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            content,
            attachmentUrl,
            attachmentType,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                role: true,
              },
            },
            reactions: true,
          },
        });

        // Broadcast to all sockets in conversation room
        io.to(`conversation_${conversationId}`).emit("new_message", message);
      } catch (err) {
        console.error("Socket send_message error:", err);
      }
    });

    socket.on("toggle_reaction", async (data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    }) => {
      try {
        const { messageId, userId, emoji, conversationId } = data;
        const existing = await prisma.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: { messageId, userId, emoji },
          },
        });

        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.messageReaction.create({
            data: { messageId, userId, emoji },
          });
        }

        const allReactions = await prisma.messageReaction.findMany({
          where: { messageId },
        });

        io.to(`conversation_${conversationId}`).emit("reaction_updated", {
          messageId,
          reactions: allReactions,
        });
      } catch (err) {
        console.error("Socket reaction error:", err);
      }
    });

    socket.on("disconnect", async () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const set = userSockets.get(currentUserId)!;
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(currentUserId);
          await prisma.user.update({
            where: { id: currentUserId },
            data: { isOnline: false, lastSeenAt: new Date() },
          }).catch(() => {});
          io.emit("user_presence", { userId: currentUserId, isOnline: false });
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Kali-Gaming platform live on http://${hostname}:${port}`);
    console.log(`> Real-time Socket.IO transport attached`);
  });
});
