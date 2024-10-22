import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate for navigation
import './style/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate(); // React Router hook to navigate

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    setIsMenuOpen(false); // Close the menu after navigating
    navigate(path); // Navigate to the specified route
  };

  return (
    <>
      <nav className="navbar">
        <div className="hamburger" onClick={toggleMenu}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
        <h1 className="navbar-title">Data Quality Analyser</h1>
      </nav>

      {/* Sidebar menu */}
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <ul className="menu">
          <li onClick={() => handleNavigation('/')}>Home</li>
          <li onClick={() => handleNavigation('/GlobalRules')}>Global Rules</li>
       
          <li onClick={() => handleNavigation('/section3')}>Section 3</li>
        </ul>
      </div>

      {/* Overlay for menu */}
      {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </>
  );
};

export default Navbar;