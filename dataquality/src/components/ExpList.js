import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './style/ExpList.css';

const ExpList = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackClick = () => {
    navigate('/');  // Navigate back without reloading the page
  };

  const handleExecute = () => {
    console.log('Executing validations and expectations...');
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
        console.log('Execution result:', data);
      })
      .catch((error) => console.error('Error executing validations:', error));
  };

  useEffect(() => {
    if (location.state?.summaryData) {
      setSummaryData(location.state.summaryData);
    }
  }, [location.state]);

  return (
    <div className="summary-container">
      <h2>Validations and Expectations Summary</h2>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Validations</th>
            <th>Expectations</th>
          </tr>
        </thead>
        <tbody>
  {summaryData.map((column, index) => (
    <tr key={index}>
      <td>{column.column}</td>
      <td>
        <div className="validation-box">
          {column.validations.map((validation, idx) => (
            <div key={idx} className="validation-item">
              {validation}
            </div>
          ))}
        </div>
      </td>
      <td>
        {Object.keys(column.expectations || {}).map((expKey, idx) => (
          <div key={idx}>
            {expKey}: {JSON.stringify(column.expectations[expKey])}
          </div>
        ))}
      </td>
    </tr>
  ))}
</tbody>
      </table>
      <div className="button-group">
        <button className="nav-button" onClick={handleBackClick}>Back</button>
        <button className="nav-button" onClick={handleExecute}>Execute</button>
      </div>

      {executionResult && (
  <div className="execution-result">
    <h3>Execution Result</h3>
    <table className="execution-table">
      <thead>
        <tr>
          <th>Expectation Type</th>
          <th>Element Count</th>
          <th>Unexpected Count</th>
          <th>Unexpected %</th>
          <th>Unexpected % (Non-Missing)</th>
          <th>Unexpected % (Total)</th>
          <th>Success</th>
        </tr>
      </thead>
      <tbody>
        {executionResult.validation_results.map((result, index) => (
          <tr key={index} className={result.success ? 'row success' : 'row fail'}>
            {/* Instead of a separate validation name column, we'll show it as part of the expectations column */}
            <td>{result.expectation_config.expectation_type.replace(/_/g, ' ')}</td>
            <td>{result.result.element_count}</td>
            <td>{result.result.unexpected_count}</td>
            <td>{result.result.unexpected_percent}</td>
            <td>{result.result.unexpected_percent_nonmissing}</td>
            <td>{result.result.unexpected_percent_total}</td>
            <td>{result.success ? 'Pass' : 'Fail'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
};

export default ExpList;