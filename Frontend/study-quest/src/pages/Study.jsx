// src/pages/Study.jsx
import React, { useState, useEffect, useRef } from 'react';
import './study.css';  // <-- import the styles here
import axios from 'axios';

const Study = () => {
  const [desiredTime, setDesiredTime] = useState(""); 
  const [isStudying, setIsStudying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionResult, setSessionResult] = useState(null);
  const [latestStory, setLatestStory] = useState(null);
  const [inputTouched, setInputTouched] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);

  const timerRef = useRef(null);
  const focusLostRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStudying) {
        focusLostRef.current = true;
        stopStudySession("Session aborted: you switched tabs.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isStudying]);

const startStudySession = () => {
  const timeInSeconds = Number(desiredTime) * 60;
  if (isNaN(timeInSeconds) || timeInSeconds <= 0) return;

  setIsStudying(true);
  setElapsedTime(0);
  setSessionStart(new Date()); // Save start time
  focusLostRef.current = false;
  timerRef.current = setInterval(() => {
    setElapsedTime((prev) => prev + 1);
  }, 1000);
};

  const handlePerformanceUpdate = async (performance) => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const universityTiers = [
      'Deferred to geomatics', // highest/best
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
      'Brock Gender Studies', // lowest/worst
    ];
    const maxTier = universityTiers.length;
    let currentUniversity = user.current_university || 6;

    // Lower index is better, so "good" means move toward 1, "bad" means move toward maxTier
    let newTier = currentUniversity;
    if (performance === "good") {
      newTier = Math.max(0, currentUniversity - 1);
    } else if (performance === "bad") {
      newTier = Math.min(maxTier, currentUniversity + 1);
    }

    // Update localStorage first
    localStorage.setItem("user", JSON.stringify({ ...user, current_university: newTier }));

    // Update backend (SQL database) with correct types
    if (user.user_id) {
      try {
        await axios.put("http://localhost:8081/update", {
          userId: Number(user.user_id),
          currentUniversity: Number(newTier),
        });
      } catch (e) {
        // Optionally handle error
        console.error("Failed to update university in backend", e);
      }
    }
  };

  const stopStudySession = async (message = null) => {
    setIsStudying(false);
    clearInterval(timerRef.current);

    const desiredTimeSeconds = Number(desiredTime) * 60;
    let performance = "average";
    const ratio = elapsedTime / desiredTime;
    if (ratio >= 0.9) performance = "good";
    else if (ratio < 0.5) performance = "bad";

    // Save session to backend
    const user = JSON.parse(localStorage.getItem("user")) || {};
    if (user.user_id && sessionStart) {
      try {
        await axios.post("http://localhost:8081/studysession", {
          user_id: user.user_id,
          start_time: sessionStart.toISOString().slice(0, 19).replace('T', ' '),
          end_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          focus_score: ratio >= 0.9 ? 2 : ratio < 0.5 ? 0 : 1,
          content: message ? message : await generateStory(performance),
        });
      } catch (e) {
        // Optionally handle error
        console.error("Failed to save study session", e);
      }
    }
    
    if (message) {
      setSessionResult(message);
    } else {
      await handlePerformanceUpdate(performance);
      const newStoryText = await generateStory(performance);
      const newChapter = {
        text: newStoryText,
        success: performance === "good"
      };

      const existingChapters = JSON.parse(localStorage.getItem("studyChapters")) || [];
      const updatedChapters = [...existingChapters, newChapter];
      localStorage.setItem("studyChapters", JSON.stringify(updatedChapters));

      setLatestStory(newStoryText);
      setSessionResult(`Study session complete! (${performance})`);
    }
  };

  // Replace the old generateStory with an async function that calls the backend
  const generateStory = async (performance) => {
    // Map performance to backend parameters
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const planned_duration = Number(desiredTime);
    const actual_duration = Math.floor(elapsedTime / 60);

    try {
      const response = await axios.post("http://localhost:5000/study-session", {
        user_id: user.user_id || "default",
        planned_duration,
        actual_duration
      });
      if (response.data && response.data.success) {
        return response.data.segment;
      } else {
        return "Could not generate story. Please try again later.";
      }
    } catch (e) {
      return "Error connecting to story backend.";
    }
  };

  return (
    <div className="study-page">
      <h2>Study Session</h2>

      <div>
        <label>Set Study Goal (minutes):</label>
       <input
            type="number"
            placeholder="Enter minutes..."
            value={desiredTime}
            onChange={(e) => setDesiredTime(e.target.value)}
            disabled={isStudying}
        />

      </div>

      {!isStudying ? (
        <button onClick={startStudySession} disabled={Number(desiredTime) <= 0}>
  Start Studying
</button>

      ) : (
        <button onClick={() => stopStudySession()}>
          End Session
        </button>
      )}

      <div>
        <h3>Elapsed Time: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</h3>
      </div>

      {sessionResult && (
        <div>
          <h4>{sessionResult}</h4>
          {latestStory && <p><strong>New Chapter:</strong> {latestStory}</p>}
        </div>
      )}
    </div>
  );
};

export default Study;
