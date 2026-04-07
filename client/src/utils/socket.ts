import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace("/api/v1", "")
  : "http://localhost:5000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

socket.on("connect", () => {
  socket.emit("join_admin_room");
});

export default socket;
