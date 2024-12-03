import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/AzureConfig.css'; // Import CSS file for styling

const AzureConfig = () => {
  const [connectionString, setConnectionString] = useState('');
  const [containers, setContainers] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:5000/connect-azure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_string: connectionString }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Connected successfully!');
        setContainers(data.containers);
        navigate('/rules');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while connecting.');
    }
  };

  return (
    <div className="azure-config-container">
      <h2 className="azure-config-title">Azure Configuration</h2>
      <form className="azure-config-form" onSubmit={handleSubmit}>
        <label className="azure-config-label">
          Connection String:
          <input
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            required
            className="azure-config-input"
          />
        </label>
        <button type="submit" className="azure-config-button">
          Connect
        </button>
      </form>

      {containers.length > 0 && (
        <div className="azure-config-containers">
          <h3>Containers:</h3>
          <ul className="azure-config-container-list">
            {containers.map((name, index) => (
              <li key={index} className="azure-config-container-item">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AzureConfig;
