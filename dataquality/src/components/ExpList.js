import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './style/ExpList.css';

const ExpList = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore saved summary data from localStorage when navigating back
  useEffect(() => {
    if (location.state && location.state.summaryData) {
      setSummaryData(location.state.summaryData);
      localStorage.setItem('summaryData', JSON.stringify(location.state.summaryData));
    } else {
      const savedSummaryData = JSON.parse(localStorage.getItem('summaryData'));
      if (savedSummaryData) {
        setSummaryData(savedSummaryData);
      } else {
        console.error('No summary data available');
      }
    }
  }, [location.state]);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleExecute = () => {
    fetch('http://127.0.0.1:5000/run-validations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summaryData), // Send the summary data for execution
    })
      .then((response) => response.json())
      .then((data) => {
        setExecutionResult(data);
      })
      .catch((error) => {
        console.error('Error executing:', error);
      });
  };

  return (
    <div className="summary-container">
      <h2>Summary of Validations and Expectations</h2>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>Validations</th>
            <th>Expectations</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((col, index) => (
            <tr key={index}>
              <td>{col.column}</td>
              <td>
                <div className="validation-box">
                  {col.validations.map((validation, idx) => (
                    <div className="validation-item" key={idx}>{validation}</div>
                  ))}
                </div>
              </td>
              <td>
                {Object.entries(col.expectations).map(([key, value]) => (
                  <div key={key}>{key}: {JSON.stringify(value)}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {executionResult && (
        <div className="execution-result">
          <h3>Execution Result</h3>
          <pre>{JSON.stringify(executionResult, null, 2)}</pre>
        </div>
      )}

      <div className="button-group">
        <button className="nav-button" onClick={handleBackClick}>Back</button>
        <button className="

execute-button" onClick={handleExecute}>Execute</button>
      </div>
    </div>
  );
};

export default ExpList;