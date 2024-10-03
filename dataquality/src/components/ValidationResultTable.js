import React, { useState } from 'react';

const ValidationResultTable = () => {
  const [executionResult, setExecutionResult] = useState(null);

  // Handle execution and fetch result
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
        console.log('Execution result:', data);
        setExecutionResult(data); // Store the execution result
      })
      .catch((error) => {
        console.error('Error executing:', error);
      });
  };

  // Extract necessary data from validation results
  const extractRelevantData = (validationResults) => {
    return validationResults.map((result, index) => ({
      expectationType: result.expectation_config.expectation_type,
      column: result.expectation_config.kwargs.column,
      elementCount: result.result.element_count,
      unexpectedCount: result.result.unexpected_count,
      unexpectedPercent: result.result.unexpected_percent.toFixed(2), // Formatting percent to 2 decimal places
      success: result.success ? 'Yes' : 'No',
    }));
  };

  return (
    <div>
      <button onClick={handleExecute}>Execute</button>

      {executionResult && executionResult.validation_results && (
        <table border="1" cellPadding="10" style={{ marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Expectation Type</th>
              <th>Column</th>
              <th>Element Count</th>
              <th>Unexpected Count</th>
              <th>Unexpected Percent</th>
              <th>Success</th>
            </tr>
          </thead>
          <tbody>
            {extractRelevantData(executionResult.validation_results).map((row, index) => (
              <tr key={index}>
                <td>{row.expectationType}</td>
                <td>{row.column}</td>
                <td>{row.elementCount}</td>
                <td>{row.unexpectedCount}</td>
                <td>{row.unexpectedPercent}%</td>
                <td>{row.success}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ValidationResultTable;