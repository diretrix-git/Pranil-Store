import { create } from "zustand";
import { AppNotification } from "../types";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications], unreadCount: state.unreadCount + 1 })),
  markAllRead: () => set({ unreadCount: 0 }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
