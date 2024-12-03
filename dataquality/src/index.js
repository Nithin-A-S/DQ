import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import CSVUpload from './CSVupload';
import ExpList from './components/ExpList'; // Import the ExpList component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GlobalRules from './components/GlobalRules';
import Home from './components/Home';
import AzureConfig from './components/AzureConfig';
import FileUpload from './components/FileUpload';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <Router>
      <Navbar title="My Custom Navbar" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/azure" element={<AzureConfig />} />
        <Route path="/rules" element={<CSVUpload />} />
        <Route path="/explist" element={<ExpList />} /> 
        <Route path="/GlobalRules" element={<GlobalRules />} />
        <Route path="/FileUpload" element={<FileUpload />} />
      </Routes>
    </Router>


);

reportWebVitals();