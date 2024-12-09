import React, { useState, useEffect } from "react";

const LinkedSystem = ({ username }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionString, setConnectionString] = useState("");
  const [containerNames, setContainerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if the connection string exists for the current user
    fetch(`http://127.0.0.1:5000/check-connection?username=${username}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.connectionString) {
          setIsConnected(true);
          setContainerNames(data.containers || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error checking connection:", err);
        setLoading(false);
      });
  }, [username]);

  const handleConnection = () => {
    setLoading(true);
    fetch("http://127.0.0.1:5000/connect-azure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, connection_string: connectionString }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setIsConnected(true);
          setContainerNames(data.containers);
          setError("");
        } else {
          setError(data.message || "Failed to connect.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error connecting to Azure:", err);
        setError("Error connecting to Azure.");
        setLoading(false);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Linked System</h1>
      {isConnected ? (
        <div>
          <h2>ADLS Connected</h2>
          <p>Connected to Azure Data Lake Storage.</p>
          <h3>Containers:</h3>
          <ul>
            {containerNames.map((container, index) => (
              <li key={index}>{container}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h2>Connect to Azure ADLS</h2>
          <input
            type="text"
            placeholder="Enter Connection String"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
          />
          <button onClick={handleConnection}>Connect</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default LinkedSystem;
