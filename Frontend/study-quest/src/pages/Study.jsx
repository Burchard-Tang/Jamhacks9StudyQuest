// src/pages/Study.jsx
import React, { useState, useEffect, useRef } from 'react';

const Study = () => {
  const [desiredTime, setDesiredTime] = useState(0); // in seconds
  const [isStudying, setIsStudying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionResult, setSessionResult] = useState(null);
  const [latestStory, setLatestStory] = useState(null);

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
    setIsStudying(true);
    setElapsedTime(0);
    focusLostRef.current = false;
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopStudySession = (message = null) => {
    setIsStudying(false);
    clearInterval(timerRef.current);

    let performance = "average";
    const ratio = elapsedTime / desiredTime;
    if (ratio >= 0.9) performance = "good";
    else if (ratio < 0.5) performance = "bad";

    if (message) {
      setSessionResult(message);
    } else {
      const newStoryText = generateStory(performance);
      const newChapter = {
        text: newStoryText,
        success: performance === "good"
      };

      // Save to localStorage
      const existingChapters = JSON.parse(localStorage.getItem("studyChapters")) || [];
      const updatedChapters = [...existingChapters, newChapter];
      localStorage.setItem("studyChapters", JSON.stringify(updatedChapters));

      setLatestStory(newStoryText);
      setSessionResult(`Study session complete! (${performance})`);
    }
  };

  const generateStory = (performance) => {
    const good = [
      "You aced the exam and earned a prestigious scholarship!",
      "You impressed the admissions team and boosted your portfolio!",
      "Your research project won an academic award!"
    ];
    const average = [
      "You completed your work and stayed on track.",
      "You kept pace with your peers, but nothing big happened.",
      "You got through the day with minor achievements."
    ];
    const bad = [
      "You missed your goals and fell behind.",
      "You got distracted and forgot a major assignment.",
      "Your study session was wasted on scrolling memes."
    ];

    const options = performance === 'good' ? good : performance === 'bad' ? bad : average;
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="study-page">
      <h2>Study Session</h2>

      <div>
        <label>Set Study Goal (minutes): </label>
        <input
          type="number"
          value={desiredTime / 60}
          onChange={(e) => setDesiredTime(Number(e.target.value) * 60)}
          disabled={isStudying}
        />
      </div>

      {!isStudying ? (
        <button onClick={startStudySession} disabled={desiredTime <= 0}>
          Start Studying
        </button>
      ) : (
        <button onClick={() => stopStudySession()}>End Session</button>
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
