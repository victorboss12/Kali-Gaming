import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_WHEEL_SEGMENTS } from "../backend/lib/rng";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Kali-Gaming database (1-on-1 Admin direct chats & in-house casino games)...");

  // 1. Rewards Definitions
  for (const seg of DEFAULT_WHEEL_SEGMENTS) {
    await prisma.rewardDefinition.upsert({
      where: { key: seg.key },
      update: {
        name: seg.name,
        description: seg.description,
        icon: seg.icon,
        type: seg.type,
        probability: seg.weight / 100,
        colorHex: seg.colorHex,
        segmentIndex: seg.index,
        xpValue: seg.xpValue,
      },
      create: {
        key: seg.key,
        name: seg.name,
        description: seg.description,
        icon: seg.icon,
        type: seg.type,
        probability: seg.weight / 100,
        colorHex: seg.colorHex,
        segmentIndex: seg.index,
        xpValue: seg.xpValue,
      },
    });
  }

  // 2. Staff Admin User
  const adminPasswordHash = await bcrypt.hash("KaliAdmin123!", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kali-gaming.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@kali-gaming.com",
      username: "kali_admin",
      displayName: "Kali Platform Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatar: "/avatars/avatar-admin.svg",
      bio: "Official Kali-Gaming Platform Administrator. Here 24/7 for direct player assistance.",
      isOnline: true,
      xp: 9999,
    },
  });

  // Support Agent User
  const supportUser = await prisma.user.upsert({
    where: { email: "support@kali-gaming.com" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "support@kali-gaming.com",
      username: "kali_support",
      displayName: "Kali Gaming Support",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatar: "/avatars/avatar-support.svg",
      bio: "Official Kali-Gaming Live Support Desk.",
      isOnline: true,
      xp: 5000,
    },
  });

  // 3. Test Players
  const playerPasswordHash = await bcrypt.hash("Player123!", 10);
  const player1 = await prisma.user.upsert({
    where: { email: "player1@kali-gaming.com" },
    update: { passwordHash: playerPasswordHash },
    create: {
      email: "player1@kali-gaming.com",
      username: "kali_phoenix",
      displayName: "Phoenix Rider",
      passwordHash: playerPasswordHash,
      role: "USER",
      avatar: "/avatars/avatar-1.svg",
      bio: "High roller fish table hunter. Master of Kali Fishing Hunter!",
      isOnline: true,
      xp: 1500,
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: "player2@kali-gaming.com" },
    update: { passwordHash: playerPasswordHash },
    create: {
      email: "player2@kali-gaming.com",
      username: "cyber_wolf",
      displayName: "Cyber Wolf",
      passwordHash: playerPasswordHash,
      role: "USER",
      avatar: "/avatars/avatar-2.svg",
      bio: "Milkyway & Firekirin grinder. Always looking for jackpot multipliers.",
      isOnline: false,
      xp: 920,
    },
  });

  // 4. Friendships
  await prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: player1.id,
        addresseeId: player2.id,
      },
    },
    update: { status: "ACCEPTED" },
    create: {
      requesterId: player1.id,
      addresseeId: player2.id,
      status: "ACCEPTED",
    },
  });

  // 5. Direct 1-on-1 Chat between Player 1 and Admin
  const adminP1Conv = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: player1.id } } },
        { members: { some: { userId: adminUser.id } } },
      ],
    },
  });

  if (!adminP1Conv) {
    const conv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        title: "Kali Platform Administrator",
        members: {
          create: [
            { userId: player1.id, role: "MEMBER" },
            { userId: adminUser.id, role: "ADMIN" },
          ],
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: adminUser.id,
        content: `Welcome to Kali-Gaming, Phoenix! I am the platform Administrator. You have direct 1-on-1 access to me right here for instant game setup, credit assistance, or VIP reward inquiries.`,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: player1.id,
        content: "Thanks Admin! Loving the new In-House Fishing Casino Game. The Leviathan 150x multiplier is awesome!",
      },
    });
  }

  // 6. Direct 1-on-1 Chat between Player 2 and Admin
  const adminP2Conv = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: player2.id } } },
        { members: { some: { userId: adminUser.id } } },
      ],
    },
  });

  if (!adminP2Conv) {
    const conv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        title: "Kali Platform Administrator",
        members: {
          create: [
            { userId: player2.id, role: "MEMBER" },
            { userId: adminUser.id, role: "ADMIN" },
          ],
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: adminUser.id,
        content: `Hello Cyber Wolf! Welcome to Kali-Gaming. Feel free to message me anytime for assistance.`,
      },
    });
  }

  // 7. Ensure no player-to-player / friend chat exists (strictly Player <-> Admin only)
  const nonAdminConvs = await prisma.conversation.findMany({
    where: {
      type: "DIRECT",
      members: {
        none: {
          user: {
            role: "ADMIN",
          },
        },
      },
    },
    include: { members: true },
  });

  for (const c of nonAdminConvs) {
    await prisma.messageReaction.deleteMany({
      where: { message: { conversationId: c.id } },
    });
    await prisma.message.deleteMany({
      where: { conversationId: c.id },
    });
    await prisma.conversationMember.deleteMany({
      where: { conversationId: c.id },
    });
    await prisma.conversation.delete({
      where: { id: c.id },
    });
  }

  // 8. Official Support Ticket Dialogue matching kali-gaming.com/support
  const supportConv = await prisma.conversation.findFirst({
    where: {
      type: "SUPPORT",
      members: { some: { userId: player1.id } },
    },
  });

  if (!supportConv) {
    const supp = await prisma.conversation.create({
      data: {
        type: "SUPPORT",
        title: "Support Ticket - Milkyway Setup",
        members: {
          create: [
            { userId: supportUser.id, role: "ADMIN" },
            { userId: player1.id, role: "MEMBER" },
          ],
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: supp.id,
        senderId: supportUser.id,
        content: "Wanna Play Now",
        createdAt: new Date(Date.now() - 60000 * 5),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: supp.id,
        senderId: player1.id,
        content: "Yes",
        createdAt: new Date(Date.now() - 60000 * 4),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: supp.id,
        senderId: supportUser.id,
        content: "which Game",
        createdAt: new Date(Date.now() - 60000 * 3),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: supp.id,
        senderId: player1.id,
        content: "Milkyway",
        createdAt: new Date(Date.now() - 60000 * 2),
      },
    });
  }

  // 9. Grant welcome badge to player1
  const highRollerDef = await prisma.rewardDefinition.findUnique({
    where: { key: "high_roller_badge" },
  });
  if (highRollerDef) {
    await prisma.userReward.upsert({
      where: {
        userId_rewardId: {
          userId: player1.id,
          rewardId: highRollerDef.id,
        },
      },
      update: { isEquipped: true },
      create: {
        userId: player1.id,
        rewardId: highRollerDef.id,
        isEquipped: true,
      },
    });
  }

  // 10. Chime Payment Gateway & QR Showing System
  const chimeGateway = await prisma.paymentGatewaySetting.upsert({
    where: { gatewayKey: "CHIME" },
    update: {
      chimeTag: "$KaliGamingPay",
      accountName: "Kali Gaming Official Cashier",
      instructions: "Send payment via Chime app. Please include your Kali username in the 'For' note for instant crediting.",
      qrCodeUrl: "/chime-qr.svg",
      isEnabled: true,
      minAmount: 10.0,
      maxAmount: 2000.0,
    },
    create: {
      gatewayKey: "CHIME",
      title: "Chime Instant Pay",
      chimeTag: "$KaliGamingPay",
      accountName: "Kali Gaming Official Cashier",
      instructions: "Send payment via Chime app. Please include your Kali username in the 'For' note for instant crediting.",
      qrCodeUrl: "/chime-qr.svg",
      isEnabled: true,
      minAmount: 10.0,
      maxAmount: 2000.0,
      note: "Deposits are verified & credited within 2-5 minutes.",
    },
  });

  // Seed sample pending deposit for Player 1
  const existingTx = await prisma.paymentTransaction.findFirst({
    where: { userId: player1.id },
  });

  if (!existingTx) {
    await prisma.paymentTransaction.create({
      data: {
        userId: player1.id,
        gateway: "CHIME",
        amount: 50.0,
        chimeSenderTag: "$PhoenixWinner",
        referenceNote: "Ref #CHM-8921-Deposit for Kali Fishing game coins",
        status: "APPROVED",
        adminNote: "Verified transfer from Chime tag $PhoenixWinner. Credited 5,000 demo coins + 500 XP.",
      },
    });
  }

  console.log("Database seeded successfully with 1-on-1 direct channels & Chime QR gateway!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
