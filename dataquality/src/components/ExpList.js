// import React, { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import './style/ExpList.css';
// import QualityStatus from './QualityStatus';  // Import the popup component

// const ExpList = () => {
//   const [summaryData, setSummaryData] = useState([]);
//   const [executionResult, setExecutionResult] = useState(null);
//   const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
//   const [loading, setLoading] = useState(false); // State to control loader visibility
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleBackClick = () => {
//     navigate('/rules'); // Navigate back without reloading the page
//   };

//   const handleExecute = () => {
//     console.log('Executing validations and expectations...');
//     setLoading(true); // Show loader
//     fetch('http://127.0.0.1:5000/run-validations', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(summaryData), // Send the summary data for execution
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         setExecutionResult(data);
//         console.log('Execution result:', data);
//       })
//       .catch((error) => console.error('Error executing validations:', error))
//       .finally(() => setLoading(false)); // Hide loader after execution
//   };

//   const handleDisplayClick = () => {
//     setShowPopup(true); // Show the popup when "Display" button is clicked
//   };

//   const handleClosePopup = () => {
//     setShowPopup(false); // Hide the popup when the close button is clicked
//   };

//   useEffect(() => {
//     if (location.state?.summaryData) {
//       setSummaryData(location.state.summaryData);
//     }
//   }, [location.state]);

//   return (
//     <div className="summary-container">
//       <h2>Global rules and Custom rules Summary</h2>
//       <table className="summary-table">
//         <thead>
//           <tr>
//             <th>Column Name</th>
//             <th>Global Rules</th>
//             <th>Custom Rules</th>
//           </tr>
//         </thead>
//         <tbody>
//           {summaryData && summaryData.map((column, index) => (
//             <tr key={index}>
//               <td>{column.column}</td>
//               <td>
//                 <div className="validation-box">
//                   {column.globalRules && column.globalRules.length > 0 ? (
//                     column.globalRules.map((rule, idx) => (
//                       <div key={idx} className="validation-item">
//                         {rule}
//                       </div>
//                     ))
//                   ) : (
//                     <div>No Validations</div>
//                   )}
//                 </div>
//               </td>
//               <td>
//                 {column.customRules ? (
//                   Object.keys(column.customRules).map((expKey, idx) => (
//                     <div key={idx}>
//                       {expKey}: {JSON.stringify(column.customRules[expKey])}
//                     </div>
//                   ))
//                 ) : (
//                   <div>No Expectations</div>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <div className="button-group">
//         <button className="nav-button" onClick={handleBackClick}>
//           Back
//         </button>
//         <button className="nav-button" onClick={handleExecute}>
//           Execute
//         </button>
//         {executionResult && (
//           <button className="nav-button" onClick={handleDisplayClick}>
//             Display
//           </button>
//         )}
//       </div>

//       {loading && (
//         <div className="loader-container">
//           <div className="loader"></div>
//         </div>
//       )}

//       {executionResult && (
//         <div className="execution-result">
//           <h3>Execution Result</h3>
//           <table className="execution-table">
//             <thead>
//               <tr>
//                 <th>Column Name</th>
//                 <th>Validation/Expectation</th>
//                 <th>Element Count</th>
//                 <th>Unexpected Count</th>
//                 <th>Unexpected %</th>
//                 <th>Unexpected % (Non-Missing)</th>
//                 <th>Unexpected % (Total)</th>
//                 <th>Success</th>
//               </tr>
//             </thead>
//             <tbody>
//               {executionResult.validation_results.map((result, index) => (
//                 <tr key={index} className={result.success ? 'row success' : 'row fail'}>
//                   <td>{result.expectation_config.kwargs.column}</td>
//                   <td>{result.expectation_config.expectation_type.replace(/_/g, ' ')}</td>
//                   <td>{result.result.element_count}</td>
//                   <td>{result.result.unexpected_count}</td>
//                   <td>{result.result.unexpected_percent}</td>
//                   <td>{result.result.unexpected_percent_nonmissing}</td>
//                   <td>{result.result.unexpected_percent_total}</td>
//                   <td>{result.success ? 'Pass' : 'Fail'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {showPopup && (
//         <QualityStatus executionResult={executionResult} onClose={handleClosePopup} />
//       )}
//     </div>
//   );
// };

// export default ExpList;
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './style/ExpList.css';
import QualityStatus from './QualityStatus';  // Import the popup component
 
const ExpList = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [executionResult, setExecutionResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [loading, setLoading] = useState(false); // State to control loader visibility
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBackClick = () => {
    navigate('/rules'); // Navigate back without reloading the page
  };
  
  // localStorage.clear();

  const handleExecute = () => {
    console.log('Executing validations and expectations...');
    setLoading(true); // Show loader
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
      .catch((error) => console.error('Error executing validations:', error))
      .finally(() => setLoading(false)); // Hide loader after execution
  };
 
  const handleDisplayClick = () => {
    setShowPopup(true); // Show the popup when "Display" button is clicked
  };
 
  const handleClosePopup = () => {
    setShowPopup(false); // Hide the popup when the close button is clicked
  };
 
  useEffect(() => {
    if (location.state?.summaryData) {
      setSummaryData(location.state.summaryData);
      console.log("summary is sent here :> ",summaryData);
    }
  }, [location.state.summaryData]);
 
  return (
    <div className="summary-container">
      <h2>Global rules and Custom rules Summary</h2>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Global Rules</th>
            <th>Custom Rules</th>
          </tr>
        </thead>
        <tbody>
          {summaryData && summaryData.map((column, index) => (
            <tr key={index}>
              <td>{column.column}</td>
              <td>
                <div className="validation-box">
                  {column.globalRules && column.globalRules.length > 0 ? (
                    column.globalRules.map((rule, idx) => (
                      <div key={idx} className="validation-item">
                        {rule}
                      </div>
                    ))
                  ) : (
                    <div>No Validations</div>
                  )}
                </div>
              </td>
              <td>
                {column.customRules ? (
                  Object.keys(column.customRules).map((expKey, idx) => (
                    <div key={idx}>
                      {expKey}: {JSON.stringify(column.customRules[expKey])}
                    </div>
                  ))
                ) : (
                  <div>No Expectations</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
 
      <div className="button-group">
        <button className="nav-button" onClick={handleBackClick}>
          Back
        </button>
        <button className="nav-button" onClick={handleExecute}>
          Execute
        </button>
        {executionResult && (
          <button className="nav-button" onClick={handleDisplayClick}>
            Display
          </button>
        )}
      </div>
 
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}
 
      {executionResult && (
        <div className="execution-result">
          <h3>Execution Result</h3>
          <table className="execution-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Validation/Expectation</th>
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
                  <td>{result.expectation_config.kwargs.column}</td>
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
 
      {showPopup && (
        <QualityStatus executionResult={executionResult} onClose={handleClosePopup} />
      )}
    </div>
  );
};
 
export default ExpList;
 
 