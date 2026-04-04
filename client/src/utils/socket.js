import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:5000';

// Single shared socket instance — lazy connect (autoConnect: false)
const socket = io(SOCKET_URL, {
  withCredentials: true,   // sends the httpOnly JWT cookie
  autoConnect: false,      // connect manually after login
});

// On reconnect, re-join admin_room automatically
socket.on('connect', () => {
  socket.emit('join_admin_room');
});

export default socket;
