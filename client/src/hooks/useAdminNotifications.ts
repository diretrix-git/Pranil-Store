import { useEffect } from "react";
import socket, { connectSocket } from "../utils/socket";
import useNotificationStore from "../store/notificationStore";
import { AppNotification } from "../types";

export default function useAdminNotifications(): void {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    connectSocket();

    const handleNewOrder = (data: any) => {
      addNotification({ type: "order", ...data, receivedAt: new Date().toISOString() } as AppNotification);
    };
    const handleNewMessage = (data: any) => {
      addNotification({ type: "message", ...data, receivedAt: new Date().toISOString() } as AppNotification);
    };

    socket.on("new_order", handleNewOrder);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("new_message", handleNewMessage);
    };
  }, [addNotification]);
}
