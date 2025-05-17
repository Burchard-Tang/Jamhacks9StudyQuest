import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FrontPage from './pages/FrontPage';
import Login from './pages/Login';
import TopBar from './pages/TopBar';
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import Groups from './pages/Groups';
import Storage from './pages/Storage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<TopBar />} >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="study" element={<Study />} />
          <Route path="groups" element={<Groups />} />
          <Route path="storage" element={<Storage />} />
        </Route>
      </Routes>
    </BrowserRouter >
  );
}

export default App;
