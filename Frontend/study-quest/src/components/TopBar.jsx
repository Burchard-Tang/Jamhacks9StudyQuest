// src/components/TopBar.jsx

import { Link, Outlet, useNavigate } from 'react-router-dom';
import './TopBar.css'; // Optional: for styling

function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear tokens or auth data if needed
    // Then redirect to login page
    navigate('/login');
  };

  return (
    <div>
      <nav className="topbar">
        <ul className="nav-links">
          <li><Link to="/app/dashboard">Dashboard</Link></li>
          <li><Link to="/app/study">Study</Link></li>
          <li><Link to="/app/groups">Groups</Link></li>
          <li><Link to="/app/storage">Storage</Link></li>
          <li><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </nav>

      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

export default TopBar;
