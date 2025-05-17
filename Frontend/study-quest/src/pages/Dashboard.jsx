import React, { useEffect, useState } from 'react';
import './Dashboard.css';

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

const Dashboard = () => {
  const [chapters, setChapters] = useState([]);
  const [currentUniversity, setCurrentUniversity] = useState('UofT');
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('studyChapters')) || [];
    setChapters(stored);
    setVisibleIndex(stored.length - 1);

    const netScore = stored.reduce((acc, ch) => acc + (ch.success ? 1 : -1), 0);
    const index = Math.max(0, Math.min(universityTiers.length - 1, 4 - Math.floor(netScore / 2)));
    setCurrentUniversity(universityTiers[index]);
  }, []);

  const handlePrev = () => {
    if (visibleIndex > 0) setVisibleIndex(visibleIndex - 1);
  };

  const handleNext = () => {
    if (visibleIndex < chapters.length - 1) setVisibleIndex(visibleIndex + 1);
  };

  const currentChapter = chapters[visibleIndex];

  return (
    <div className="dashboard">
      <div className="school-status">
        <h2>Your Character's Current University</h2>
        <div className="school-tier">{currentUniversity}</div>
      </div>

      <div className="chapters">
        <h2>Story Progress</h2>
        {currentChapter ? (
          <div className="chapter">
            <strong>Session {visibleIndex + 1} {currentChapter.success ? "📘" : "📕"}:</strong>
            <p>{currentChapter.text}</p>
          </div>
        ) : (
          <p>No chapters yet. Start studying!</p>
        )}

        <div className="chapter-nav">
          <button onClick={handlePrev} disabled={visibleIndex === 0}>
            ◀ Previous
          </button>
          <span className="chapter-counter">
            {chapters.length > 0 ? `Chapter ${visibleIndex + 1} of ${chapters.length}` : ''}
          </span>
          <button onClick={handleNext} disabled={visibleIndex === chapters.length - 1}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
