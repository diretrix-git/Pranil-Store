import { Outlet } from 'react-router-dom';

// AdminLayout is kept for future use (e.g. sidebar, breadcrumbs).
// The notification bell and hook are now mounted inside Navbar directly,
// so they appear on every page including the home page when admin is logged in.
export default function AdminLayout() {
  return <Outlet />;
}
