// src/components/TopBar.jsx

import { Link, Outlet, useNavigate } from 'react-router-dom';
import './TopBar.css';
import { useEffect } from 'react';
import axios from 'axios';

function TopBar() {
  const navigate = useNavigate();

  // Example user info (replace with actual data or props)
  const user = JSON.parse(localStorage.getItem('user')) || 'John Doe';
  console.log(user);
  const university = user.current_university ? user.current_university : 1;
  console.log("unnuuniii" + university)

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
  'You\'re cooked',
  'Brock Gender Studies',
];

  const handleLogout = async () => {
    // Save current university to SQL before logout
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
          <p>{user.username}: {universityTiers[university] || university}</p>
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
