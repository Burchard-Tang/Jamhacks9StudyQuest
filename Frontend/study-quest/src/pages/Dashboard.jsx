// src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const universityTiers = [
  'Harvard',
  'UofT',
  'Queens',
  'McMaster',
  'Waterloo',
  'York',
  'Toronto Metropolitan',
  'Seneca'
];

const Dashboard = () => {
  const [chapters, setChapters] = useState([]);
  const [currentUniversity, setCurrentUniversity] = useState('UofT');

  useEffect(() => {
    // Load chapters from localStorage
    const stored = JSON.parse(localStorage.getItem('studyChapters')) || [];
    setChapters(stored);

    // Simulate university based on chapter count and success
    const netScore = stored.reduce((acc, ch) => acc + (ch.success ? 1 : -1), 0);
    const index = Math.max(0, Math.min(universityTiers.length - 1, 4 - Math.floor(netScore / 2)));
    setCurrentUniversity(universityTiers[index]);
  }, []);

  return (
    <div className="dashboard">
      <div className="school-status">
        <h2>Your Character's Current University</h2>
        <div className="school-tier">{currentUniversity}</div>
      </div>

      <div className="chapters">
        <h2>Story Progress</h2>
        <ol className="chapter-list">
          {chapters.map((chapter, index) => (
            <li key={index} className="chapter">
              <strong>Session {index + 1}:</strong> {chapter.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
