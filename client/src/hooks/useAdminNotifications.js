import { useEffect } from 'react';
import socket from '../utils/socket';
import useNotificationStore from '../store/notificationStore';

export default function useAdminNotifications() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('join_admin_room');

    const handleNewOrder = (data) => {
      addNotification({ type: 'order', ...data, receivedAt: new Date().toISOString() });
    };

    const handleNewMessage = (data) => {
      addNotification({ type: 'message', ...data, receivedAt: new Date().toISOString() });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('new_message', handleNewMessage);
    };
  }, [addNotification]);
}
