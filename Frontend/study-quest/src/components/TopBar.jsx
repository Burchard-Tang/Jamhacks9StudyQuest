// src/components/TopBar.jsx

import { Link, Outlet, useNavigate } from 'react-router-dom';
import './TopBar.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

function TopBar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
  const [university, setUniversity] = useState(user.current_university ? user.current_university : 1);

  const universityTiers = [
    'Deferred to geomatics',
    'Stanford',
    'MIT',
    'Harvard',
    'Waterloo CS',
    'UofT',
    'UBC',
    'McMaster',
    'Queens',
    'Toronto Metropolitan',
    'York',
    'Seneca',
    "You're cooked",
    'Brock Gender Studies',
  ];

  // Listen for localStorage changes (cross-tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user') {
        const updatedUser = JSON.parse(localStorage.getItem('user')) || {};
        setUser(updatedUser);
        setUniversity(updatedUser.current_university ? updatedUser.current_university : 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Poll for user/current_university changes in same tab
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedUser = JSON.parse(localStorage.getItem('user')) || {};
      if (updatedUser.current_university !== university) {
        setUser(updatedUser);
        setUniversity(updatedUser.current_university ? updatedUser.current_university : 1);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [university]);

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.user_id && user.current_university) {
      try {
        await axios.put("http://localhost:8081/update", {
          userId: user.user_id,
          currentUniversity: user.current_university,
        });
      } catch (e) {
        // Optionally handle error
      }
    }
    navigate('/login');
  };

  return (
    <div>
      <nav className="topbar">
        <div className="user-info">
          <p>{user.username}: {universityTiers[Math.min(Math.max(university,0), universityTiers.length-1)]}</p>
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
