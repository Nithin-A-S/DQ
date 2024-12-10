import React from 'react';
import './style/Home.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
const Home = ({username}) => {
    const navigate = useNavigate();
    const {user}=useUser();
    console.log(username);
    const Handlereport=()=>{
      navigate('/report');}
  return (
    <div className="home-container1">
      <div className="home-hero-section">
        <h1 className="home-hero-title">Welcome to DataQuality Tool</h1>
        <p className="home-hero-description">
          Ensure the quality and correctness of your data with ease. Get detailed analytics and scores to make your data-driven decisions accurate and reliable.
        <br /><br />
        Click on Newcreport or getstarted button to begin</p>
        <button className="home-cta-button"  onClick={Handlereport}>Get Started</button>
      </div>
      <div className="home-features-section">
        <h2 className="home-features-title">Why Choose Us?</h2>
        <ul className="home-features-list">
          <li>Quick and accurate data quality checks.</li>
          <li>Get a detailed analysis and quality score.</li>
          <li>Identify and fix issues in your datasets effortlessly.</li>
          <li>Enhance trust in your data for better decision-making.</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
