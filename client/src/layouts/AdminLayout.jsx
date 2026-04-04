import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import useAdminNotifications from '../hooks/useAdminNotifications';
import useNotificationStore from '../store/notificationStore';
import NotificationsPanel from '../components/admin/NotificationsPanel';

/**
 * Wraps all admin pages.
 * - Mounts the useAdminNotifications hook (Socket.io listener)
 * - Renders the NotificationsPanel
 * - Exposes a bell button via a portal-style overlay
 */
export default function AdminLayout() {
  useAdminNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <>
      {/* Bell button — fixed top-right, above navbar z-index */}
      <div className="fixed top-3 right-20 z-[60] md:right-24">
        <button
          onClick={() => setPanelOpen(true)}
          className="relative p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          aria-label="Notifications"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />

      <Outlet />
    </>
  );
}
