import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Navbar.css';
import { FaFileAlt, FaLink, FaGlobe, FaUser, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ title, onLogout }) => {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/userID-delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        localStorage.removeItem('userName'); // Clear userName from local storage
        setUserName(''); // Clear the userName state
        onLogout(); // Call the logout handler from App.js
        navigate('/'); // Redirect to the login page
      } else {
        console.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="fixed-sidebar">
      <h1 className="sidebar-title">{title}</h1>
      <ul className="menu">
        <li onClick={() => handleNavigation('/report')}>
          <FaFileAlt /> New Report
        </li>
        <li onClick={() => handleNavigation('/')}>
          <FaUser /> My Reports
        </li>
        <li onClick={() => handleNavigation('/linkedsystem')}>
          <FaLink /> Linked Systems
        </li>
        <li onClick={() => handleNavigation('/GlobalRules')}>
          <FaGlobe /> Global Rules
        </li>
      </ul>

      <div className="user-section">
        <button className="username-btn" onClick={handleLogout}>{userName}</button>
        <div className="logout-hover" >
          <FaSignOutAlt /> Logout
        </div>
      </div>
    </div>
  );
};

export default Navbar;
