import React from 'react';
import './style/Summary.css'
const SummaryPopup = ({ trigger, setTrigger, selectedColumn, selectedValidations, columnExpectations }) => {

  // Get the validations and expectations for the selected column
  const validations = selectedValidations[selectedColumn?.column] || [];
  const expectations = Object.entries(columnExpectations[selectedColumn?.column] || {});

  return trigger ? (
    <div className="popup">
      <div className="popup-inner-1">
        <h3>Summary for {selectedColumn?.column || 'Unknown Column'}</h3>

        <div className="summary-section">
          <h4>Global Rules:</h4>
          <ul>
            {validations.length > 0 ? (
              validations.map((validation, index) => (
                <li key={index}>{validation}</li>
              ))
            ) : (
              <li>No validations selected</li>
            )}
          </ul>
        </div>

        <div className="summary-section2">
          <h4>Custom Rules:</h4>
          <ul>
            {expectations.length > 0 ? (
              expectations.map(([expectationName, expectationDetails], index) => (
                <li key={index}>
                  <strong>{expectationName}:</strong> {JSON.stringify(expectationDetails)}
                </li>
              ))
            ) : (
              <li>No expectations set</li>
            )}
          </ul>
        </div>

        <button className="button-close" onClick={() => setTrigger(false)}>Close</button>
      </div>
    </div>
  ) : null;
};

export default SummaryPopup;