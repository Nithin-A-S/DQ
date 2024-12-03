import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Navbar.css';

const Navbar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  // Function to check connection status from localStorage
  const checkConnection = () => {
    const connected = localStorage.getItem('isConnected');
    setIsConnected(connected === 'true');
  };

  // Run this effect on component mount
  useEffect(() => {
    checkConnection();

    // Listen for changes to localStorage
    const handleStorageChange = () => checkConnection();
    window.addEventListener('storage', handleStorageChange);

    // Cleanup the listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('isConnected');
    setIsConnected(false);
    navigate('/');
    alert('Logged out successfully!');
  };

  return (
    <div className="fixed-sidebar">
      <h1 className="sidebar-title">Data Quality Analyser</h1>
      <ul className="menu">
        <li onClick={() => handleNavigation('/NewReport')}>New Report</li>
        <li onClick={() => handleNavigation('/MyReports')}>My Reports</li>
        <li onClick={() => handleNavigation('/LinkedSystems')}>Linked Systems</li>
        <li onClick={() => handleNavigation('/GlobalRules')}>Global Rules</li>
      </ul>
      {isConnected && (
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      )}
    </div>
  );
};

export default Navbar;
