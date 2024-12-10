import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import CSVUpload from './CSVupload';
import ExpList from './components/ExpList';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import GlobalRules from './components/GlobalRules';
import NewReport from './components/NewReport';
import AzureConfig from './components/AzureConfig';
import Home from './components/Home';
import LoginRegister from './components/LoginReg';
import { UserProvider } from './context/UserContext.js';
import LinkedSystem from './components/LinkedSystem.js';
import CsvFileUpload from './components/CsvFileUpload.js';
import DataCsvUpload from './components/DataCsvUpload.js';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Check for login status in localStorage on component mount
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setIsLoggedIn(true);
      setUserName(storedUserName);
    }
  }, []);

  const handleLoginSuccess = (userName) => {
    setIsLoggedIn(true);
    setUserName(userName);
    localStorage.setItem('userName', userName); // Save username to localStorage
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    localStorage.removeItem('userName'); // Remove username from localStorage
  };

  return (
    <UserProvider>
      <Router>
        {!isLoggedIn ? (
          <div className="full-screen">
            <Routes>
              <Route
                path="/"
                element={<LoginRegister onLoginSuccess={handleLoginSuccess} />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        ) : (
          <div className="app-layout">
            <Navbar title="DataQuality" onLogout={handleLogout} />
            <div className="main-content">
              <Routes>
                <Route path="/home" element={<Home />} />
  <Route path="/fileupload" element={<CsvFileUpload userName={userName} />} />
  <Route path="/linkedsystem" element={<LinkedSystem userName={userName} />} />
                <Route path="/datarulesupload" element={<DataCsvUpload />} />
                <Route path="/report" element={<NewReport userName={userName}  />} />
                <Route path="/azure" element={<AzureConfig />} />
                <Route path="/rules" element={<CSVUpload />} />
                <Route path="/explist" element={<ExpList />} />
                <Route path="/GlobalRules" element={<GlobalRules />} />
                {/* <Route path="" element={<Navigate to="/home" />} /> */}
              </Routes>
            </div>
          </div>
        )}
      </Router>
    </UserProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
