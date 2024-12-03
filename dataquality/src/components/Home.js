// Home.js
import React from 'react';
import './style/Home.css'; 
import { useNavigate } from 'react-router-dom';
const Home = () => {
    const navigate = useNavigate();
    const Handlefileupload=()=>{
      navigate('/fileupload');}
const Handleazureclick=()=>{
    navigate('/azure');

}
  return (
    <div className="home-container">
      <div className="button-container">
        <button className="home-button" onClick={Handlefileupload}>
          Upload File 
        </button>
        <button className="home-button" onClick={Handleazureclick}>
          Connect Aure
        </button>
      </div>
    </div>
  );
};

export default Home;
