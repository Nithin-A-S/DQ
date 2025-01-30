import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./style/ShowReport.css";

const ShowReport = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.report) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>No report data available.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const { report, reportId } = state;

  return (
    <div className="show-report-container">
      <h2>Report {reportId} Details</h2>
      
      {/* Header Section for Metadata */}
      <div className="report-metadata">
        <div>
          <strong>Table Name:</strong> {report.current_table || "N/A"}
        </div>
        <div>
          <strong>Source:</strong> {report.source || "N/A"}
        </div>
        <div>
          <strong>Score:</strong> {report.score || "N/A"}
        </div>
        <div>
          <strong>Report Name:</strong> {report.name || "N/A"}
        </div>
      </div>

      {/* Table for Validation Results */}
      <table className="report-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Dataset</th>
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
          {report.validation_results.map((validation, index) => (
            <tr key={index}>
              <td>{validation.expectation_config.kwargs.column}</td>
              <td>{report.current_table}</td>
              <td>{validation.expectation_config.expectation_type}</td>
              <td>{validation.result.element_count}</td>
              <td>{validation.result.unexpected_count}</td>
              <td>{validation.result.unexpected_percent}%</td>
              <td>{validation.result.unexpected_percent_nonmissing}%</td>
              <td>{validation.result.unexpected_percent_total}%</td>
              <td>
                {validation.success ? (
                  <span style={{ color: "green" }}>Pass</span>
                ) : (
                  <span style={{ color: "red" }}>Fail</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button onClick={() => navigate(-1)} className="back-button">
        Go Back
      </button>
    </div>
  );
};

export default ShowReport;
