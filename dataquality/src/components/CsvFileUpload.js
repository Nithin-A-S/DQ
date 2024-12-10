import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './style/CsvFileUpload.css';

const CsvFileUpload = () => {
  const location = useLocation();
  const currUser = location.state?.username;
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [csvHistory, setCsvHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [remItems, setRemItems] = useState([]);
  const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  useEffect(() => {
    fetchCsvHistory();
  }, []);

  const fetchCsvHistory = () => {
    fetch('http://127.0.0.1:5000/get-user-data', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: currUser }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch CSV history.');
        }
        return response.json();
      })
      .then((data) => {
        setCsvHistory(data.csvfiles || []);
      })
      .catch((error) => {
        console.error('Error fetching CSV history:', error);
        alert('Error fetching CSV history. Please try again.');
      });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Invalid file type. Only .csv and .xlsx files are allowed.');
    }
  };

  const handleUpload = () => {
    if (file) {
      const formData = new FormData();
      formData.append('username', currUser);
      formData.append('file', file);

      fetch('http://127.0.0.1:5000/data-dataset-upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('File upload failed.');
          }
          return response.json();
        })
        .then((data) => {
          alert(`File "${file.name}" uploaded successfully!`);
          fetchCsvHistory();
        })
        .catch((error) => {
          console.error('Error uploading file:', error);
          alert('Error uploading file. Please try again.');
        });
    } else {
      alert('No valid file selected.');
    }
  };

  const handleDBChanges = () => {
    fetch('http://127.0.0.1:5000/data-removedata', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: currUser, csvfiles: remItems }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update CSV history.');
        }
        return response.json();
      })
      .then(() => {
        fetchCsvHistory();
      })
      .catch((error) => {
        console.error('Error updating CSV history:', error);
        alert('Error updating CSV history. Please try again.');
      });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleDBChanges();
    }
    setIsEditing(!isEditing);
  };

  const handleDeleteChip = (fileToDelete) => () => {
    setCsvHistory((prev) => prev.filter((file) => file !== fileToDelete));
    setRemItems((prev) => [...prev, fileToDelete]);
  };

  const handleProceedCSV = () => {
    navigate('/datarulesupload', { state: { username: currUser, csvfiles: csvHistory } });
  };

  return (
    <div className="CsvFileUpload-container">
        <p>Logged in as: {currUser}</p>
      <div className="CsvFileUpload-tile CsvFileUpload-upload">
        <p>Upload Dataset</p>
        <div className="CsvFileUpload-stack">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv, .xlsx"
            className="CsvFileUpload-input"
          />
          <button onClick={handleUpload} className="CsvFileUpload-button">
            Upload
          </button>
        </div>
        {error && <p className="CsvFileUpload-error">{error}</p>}
        {file && <p className="CsvFileUpload-selectedFile">Selected file: {file.name}</p>}
      </div>
      <div className="CsvFileUpload-tile CsvFileUpload-history">
        <h2>History</h2>
        {csvHistory.length > 0 ? (
          isEditing ? (
            <div className="CsvFileUpload-chipContainer">
              {csvHistory.map((filename, index) => (
                <div key={index} className="CsvFileUpload-chip">
                  <span>{filename || 'Unnamed File'}</span>
                  <button
                    className="CsvFileUpload-chipDelete"
                    onClick={handleDeleteChip(filename)}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <ul className="CsvFileUpload-list">
              {csvHistory.map((filename, index) => (
                <li key={index}>{filename || 'Unnamed File'}</li>
              ))}
            </ul>
          )
        ) : (
          <p>No Past History</p>
        )}
      </div>
      <div className="CsvFileUpload-footer">
        <button onClick={handleProceedCSV} className="CsvFileUpload-button">
          Proceed
        </button>
        <button onClick={handleEditToggle} className="CsvFileUpload-button">
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

    </div>
  );
};

export default CsvFileUpload;
