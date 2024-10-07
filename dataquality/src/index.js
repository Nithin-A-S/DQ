import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import CSVUpload from './CSVupload';
import ExpList from './components/ExpList'; // Import the ExpList component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <Router>
      <Navbar title="My Custom Navbar" />
      <Routes>
        <Route path="/" element={<CSVUpload />} />
        <Route path="/explist" element={<ExpList />} /> {/* Add route for ExpList */}
      </Routes>
    </Router>


);

reportWebVitals();