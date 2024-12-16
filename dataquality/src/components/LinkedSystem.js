import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LinkedSystems = () => {
  const [connected, setConnected] = useState(null); // null means not checked yet
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check connection status on component mount
    const checkConnection = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/check-conn', {
          method: 'GET',
        });
        const data = await response.json();

        if (response.ok) {
          // If the connection string exists and the connection is successful
          if (data.success) {
            setConnected(true);
          } else {
            setConnected(false);
            setErrorMessage(data.message); // Error message from backend (e.g., connection string missing)
          }
        } else {
          // Handle server errors or unsuccessful responses
          setConnected(false);
          setErrorMessage(data.message || 'Something went wrong.');
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setConnected(false);
        setErrorMessage('Failed to connect. Please try again later.');
      }
    };

    checkConnection();
  }, [navigate]);

  return (
    <div>
      {connected === null ? (
        <p>Checking connection...</p> // Initial state, still checking
      ) : connected ? (
        <div>
          <h2>Connection Successful</h2>
          <p>You are successfully connected to Azure. Proceed with your operations.</p>
        </div>
      ) : (
        <div>
          <h2>Connection Failed</h2>
          <p>{errorMessage}</p>
          <p>Redirecting to Azure configuration...</p>
        </div>
      )}
    </div>
  );
};

export default LinkedSystems;
