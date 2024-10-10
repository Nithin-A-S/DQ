import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import CSVUpload from './CSVupload';
import ExpList from './components/ExpList'; // Import the ExpList component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GlobalRules from './components/GlobalRules';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <Router>
      <Navbar title="My Custom Navbar" />
      <Routes>
        <Route path="/" element={<CSVUpload />} />
        <Route path="/explist" element={<ExpList />} /> {/* Add route for ExpList */}
        <Route path="/GlobalRules" element={<GlobalRules />} />
      </Routes>
    </Router>


);

reportWebVitals();