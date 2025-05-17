// src/components/TopBar.jsx

import { Link, Outlet, useNavigate } from 'react-router-dom';
import './TopBar.css';

function TopBar() {
  const navigate = useNavigate();

  // Example user info (replace with actual data or props)
  const userName = "John Doe";
  const userUniversity = "Awesome University";

  const handleLogout = () => {
    // Clear tokens or auth data if needed
    navigate('/login');
  };

  return (
    <div>
      <nav className="topbar">
        <div className="user-info">
          <p>{userName}: {userUniversity}</p>
        </div>

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
