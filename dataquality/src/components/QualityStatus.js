import React from 'react';
import './style/QualityStatus.css';

const QualityStatus = ({ executionResult, onClose }) => {
  
  // Calculate aggregated quality percentage for each column
  const getAggregatedQuality = (columnName) => {
    const columnResults = executionResult.validation_results.filter(result => result.expectation_config.kwargs.column === columnName);

    const totalElementCount = columnResults.reduce((sum, result) => sum + result.result.element_count, 0);
    const totalUnexpectedCount = columnResults.reduce((sum, result) => sum + result.result.unexpected_count, 0);

    const qualityPercent = 100 - ((totalUnexpectedCount / totalElementCount) * 100);

    return Math.max(0, qualityPercent.toFixed(2));  // Ensure it's at least 0
  };

  // Determine color based on quality percentage
  const getColorForQuality = (qualityPercent) => {
    if (qualityPercent === 100) return 'green';
    if (qualityPercent < 40) return 'red';
    if (qualityPercent < 50) return 'orange';
    if (qualityPercent < 75) return 'yellow';
    return 'green';
  };

  return (
    <div className="quality-status-popup">
      <div className="popup-content">
        <button className="close-button" onClick={onClose}>Close</button>
        <h3>Column Quality Status</h3>
        <table className="quality-table">
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Quality (%)</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {executionResult && executionResult.validation_results && 
              [...new Set(executionResult.validation_results.map(result => result.expectation_config.kwargs.column))].map((columnName, index) => {
                const qualityPercent = getAggregatedQuality(columnName);
                const color = getColorForQuality(qualityPercent);

                return (
                  <tr key={index}>
                    <td>{columnName}</td>
                    <td>{qualityPercent}%</td>
                    <td>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${qualityPercent}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualityStatus;