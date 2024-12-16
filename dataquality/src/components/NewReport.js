import React, { useState, useEffect } from "react";
import './style/New-report.css';
import { useNavigate } from "react-router-dom";

const NewReport = () => {
  const navigate = useNavigate();
  const [isAzureConnected, setIsAzureConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem('userName');
  console.log(userName)
  // Check Azure connection status when the component mounts
  useEffect(() => {
    fetch("http://127.0.0.1:5000/check-conn")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.connectionString) {
          setIsAzureConnected(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error checking Azure connection:", err);
        setLoading(false);
      });
  }, []);

  const handleFileUpload = () => {
    navigate("/fileupload", { state: { userName } });
  };
  const handleAzureClick = () => {
    if (isAzureConnected) {
      // If Azure is connected, navigate to the rules page
      navigate("/rules");
    } else {
      // If Azure is not connected, navigate to the LinkedSystem component
      navigate("/azure");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="new-report-container">
      <h1 className="new-report-title">New Report</h1>
      <p className="new-report-description">
        To get started with generating a new report, please select one of the connectors below.
        You can either upload a CSV file or connect to Azure ADLS sources.
      </p>
      <div className="new-report-options">
        <div className="new-report-option">
          <h2 className="new-report-option-title">Upload data</h2>
          <button className="new-report-button" onClick={handleFileUpload}>
            Upload Your CSV
          </button>
        </div>
        <div className="new-report-option">
          <h2 className="new-report-option-title">Azure ADLS</h2>
          <button className="new-report-button" onClick={handleAzureClick}>
            {isAzureConnected ? "Go to Rules" : "Connect to Azure"}
          </button>
        </div>
      </div>
      <p className="new-report-note">
        Once your data is uploaded or connected, we will analyze the quality of your data and provide you with a detailed report.
      </p>
    </div>
  );
};

export default NewReport;
