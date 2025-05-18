import { Link, useNavigate } from 'react-router-dom';
import './FrontPage.css';

const FrontPage = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="frontpage">
      <div className="frontpage-content parchment">
        <h1 className="title">Welcome to StudyQuest</h1>
        <p className="slogan">Forge your path. Chronicle your progress. Become the legend of your own academic journey.</p>

        <div className="description">
          <p>
            StudyQuest transforms your studying into an epic tale. Track your progress as story chapters, rise through the university ranks,
            and immerse yourself in a fantasy-themed academic journey.
          </p>
        </div>

        <button className="start-button" onClick={handleLoginRedirect}>Begin Your Quest</button>

        <div className="chapter-progress">
          <div className="chapter-marker">Prologue</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontPage;


