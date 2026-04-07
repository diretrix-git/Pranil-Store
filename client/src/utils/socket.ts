import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace("/api/v1", "")
  : "http://localhost:5000";

// Token is injected before connect() is called
const socket = io(SOCKET_URL, {
  withCredentials: false,
  autoConnect: false,
});

socket.on("connect", () => {
  socket.emit("join_admin_room");
});

// Call this after Clerk session is ready to pass the token
export const connectSocket = async () => {
  try {
    const { Clerk } = window as any;
    if (Clerk?.session) {
      const token = await Clerk.session.getToken();
      (socket.auth as any) = { token };
    }
  } catch {
    // no-op
  }
  if (!socket.connected) socket.connect();
};

export default socket;
