import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],   // newest first, session-only (resets on refresh)
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAllRead: () => set({ unreadCount: 0 }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
