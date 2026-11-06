import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(userId?: string): Socket {
  if (!socket) {
    socket = io(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    if (userId) {
      socket.emit("authenticate", userId);
    }
  } else if (userId && socket.connected) {
    socket.emit("authenticate", userId);
  }

  return socket;
}
