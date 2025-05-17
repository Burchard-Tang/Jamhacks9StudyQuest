import { Link, Outlet } from "react-router-dom";

export default function TopBar() {
  return (
    <>
      <div className="top-bar">
        <nav className="nav-links">
          <Link to="/dashboard" className="linkObj">Dashboard</Link>
          <Link to="/study" className="linkObj">Study</Link>
          <Link to="/groups" className="linkObj">Groups</Link>
          <Link to="/storage" className="linkObj">Storage</Link>
        </nav>
      </div>
      <Outlet />
    </>
  );
}