// import React, { useState, useEffect } from "react";
// import "./style/MyReport.css";

// const ReportComponent = () => {
//   const [reports, setReports] = useState({});
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const response = await fetch("http://127.0.0.1:5000/get-reports");
//         if (!response.ok) {
//           throw new Error("Failed to fetch reports");
//         }
//         const data = await response.json();
//         console.log("Fetched Data:", data); // Debugging API response
//         if (!data.reports || Object.keys(data.reports).length === 0) {
//           setError("No reports found");
//           return;
//         }
//         setReports(data.reports);
//       } catch (err) {
//         console.error("Error:", err);
//         setError("Failed to load reports");
//       }
//     };
//     fetchReports();
//   }, []);

//   return (
//     <div className="report-container">
//       <h1>Validation Reports</h1>
//       {error ? (
//         <p className="error-message">{error}</p>
//       ) : Object.keys(reports).length > 0 ? (
//         Object.keys(reports).map((reportId) => (
//           <div key={reportId} className="report-section">
//             <h3>Report {reportId}</h3>
//             <table className="report-table">
//               <thead>
//                 <tr>
//                   <th>Column</th>
//                   <th>Expectation Type</th>
//                   <th>Partial Unexpected List</th>
//                   <th>Unexpected %</th>
//                   <th>Success</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {reports[reportId].map((validation, index) => (
//                   <tr key={index}>
//                     <td>{validation.expectation_config.kwargs.column}</td>
//                     <td>{validation.expectation_config.expectation_type}</td>
//                     <td>
//                       {validation.result.partial_unexpected_list.join(", ")}
//                     </td>
//                     <td>{validation.result.unexpected_percent}%</td>
//                     <td>
//                       {validation.success ? (
//                         <span style={{ color: "green" }}>Pass</span>
//                       ) : (
//                         <span style={{ color: "red" }}>Fail</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ))
//       ) : (
//         <p>No reports available</p>
//       )}
//     </div>
//   );
// };

// export default ReportComponent;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style/MyReport.css";

const ReportComponent = () => {
  const [reports, setReports] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get-reports");
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        if (!data.reports || Object.keys(data.reports).length === 0) {
          setError("No reports found");
          return;
        }
        setReports(data.reports);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load reports");
      }
    };
    fetchReports();
  }, []);

  const handleShowReport = (reportId) => {
    navigate(`/show-report`, {
      state: { report: reports[reportId], reportId },
    });
  };

  return (
    <div className="report-container">
      <h1>Validation Reports</h1>
      {error ? (
        <p className="error-message">{error}</p>
      ) : Object.keys(reports).length > 0 ? (
        <table className="report-list-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Date</th>
              <th>Dataset</th>
              
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(reports).map((reportId) => (
              <tr key={reportId}>
                <td>{reportId}</td>
                <td>{reports[reportId].execution_date || "N/A"}</td>
                <td>{reports[reportId].current_table || "N/A"}</td>
                <td>
                  <button
                    className="toggle-button"
                    onClick={() => handleShowReport(reportId)}
                  >
                    Show Table
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No reports available</p>
      )}
    </div>
  );
};

export default ReportComponent;
