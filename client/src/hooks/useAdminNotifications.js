import { useEffect } from 'react';
import socket from '../utils/socket';
import useNotificationStore from '../store/notificationStore';

export default function useAdminNotifications() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    // Connect and join admin room
    if (!socket.connected) socket.connect();
    socket.emit('join_admin_room');

    const handleNewOrder = (data) => {
      addNotification({ ...data, receivedAt: new Date().toISOString() });
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, [addNotification]);
}
