import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import axios from 'axios';

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
  const maxTier = universityTiers.length;
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const universityIdx = user.current_university ? user.current_university : 0;
  const [chapters, setChapters] = useState([]);
  const [currentUniversity, setCurrentUniversity] = useState(user.current_university || 6);
  const [visibleIndex, setVisibleIndex] = useState(0);

  // Fetch latest university from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Only fetch if user_id is a valid positive integer
        if (user.user_id && Number.isInteger(user.user_id) && user.user_id > 0) {
          const res = await axios.get(`http://localhost:8081/user/${user.user_id}`);
          if (res.status === 404 || (res.data && res.data.success === false)) {
            // User not found, do not update state or localStorage
            return;
          }
          if (res.data.success && res.data.user) {
            setCurrentUniversity(res.data.user.current_university);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }
      } catch (error) {
        // Suppress 404 errors, only log unexpected errors
        if (!(error.response && error.response.status === 404)) {
          console.error("Failed to fetch user from backend:", error);
        }
      }
    };
    // Only call fetchUser if user_id is valid
    if (user.user_id && Number.isInteger(user.user_id) && user.user_id > 0) {
      fetchUser();
    }
  }, [user.user_id]);

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem('studyChapters'));
    if (stored && !Array.isArray(stored) && Array.isArray(stored.chapters)) {
      stored = stored.chapters;
    }
    if (!Array.isArray(stored)) stored = [];
    setChapters(stored);
    setVisibleIndex(stored.length - 1);
  }, []);

  const handlePerformanceUpdate = (performance) => {
    let newTier = currentUniversity || 6;
    if (performance === "good") {
      newTier = Math.min(maxTier, newTier + 1);
    } else if (performance === "bad") {
      newTier = Math.max(1, newTier - 1);
    }
    setCurrentUniversity(newTier);
    axios.put("http://localhost:8081/update", {
      userId: user.user_id,
      currentUniversity: newTier,
    });
    localStorage.setItem("user", JSON.stringify({ ...user, current_university: newTier }));
  };

  const handlePrev = () => {
    if (visibleIndex > 0) setVisibleIndex(visibleIndex - 1);
  };

  const handleNext = () => {
    if (visibleIndex < chapters.length - 1) setVisibleIndex(visibleIndex + 1);
  };

  const currentChapter = chapters[visibleIndex];

  const updateLocalStorage = (chaptersArray) => {
    localStorage.setItem('studyChapters', JSON.stringify(chaptersArray));
  };

  return (
    <div className="dashboard" >
      <div className='background'>
        <div className="school-status">
          <h2>Your Character's Current University</h2>
          <div className="school-tier">
            {universityTiers[Math.min(Math.max((currentUniversity ? currentUniversity : 0,0), universityTiers.length-1))]}
          </div>
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
    </div>
  );
};

export default Dashboard;
