import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import './style/CsvFileUpload.css';

const CsvFileUpload = () => {
  const location = useLocation();
  const currUser = location.state?.email;
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [csvHistory, setCsvHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [remItems, setRemItems] = useState([]);
  const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  // Fetch CSV history on component mount
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
        console.log('User CSV history fetched successfully:', data);
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
          console.log('File uploaded successfully:', data);
          alert(`File "${file.name}" uploaded successfully!`);
          fetchCsvHistory(); // Refresh history after upload
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
      .then((data) => {
        console.log('CSV history updated successfully:', data);
        fetchCsvHistory(); // Refresh history after deletion
      })
      .catch((error) => {
        console.error('Error updating CSV history:', error);
        alert('Error updating CSV history. Please try again.');
      });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleDBChanges(); // Save changes when toggling off edit mode
    }
    setIsEditing(!isEditing);
  };

  const handleDeleteChip = (fileToDelete) => () => {
    setCsvHistory((prev) => prev.filter((file) => file !== fileToDelete));
    setRemItems((prev) => [...prev, fileToDelete]);
  };

  const handleProceedCSV = () => {
    navigate('/', { state: { username: currUser, csvfiles: csvHistory } });
  };

  return (
    <div className="tilecontainer">
      <div className="tile tile1">
        <p>Upload Dataset</p>
        <Stack spacing={3} direction="row" className="stackbox">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv, .xlsx"
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button variant="contained" component="span" color="primary">
              Choose File
            </Button>
          </label>
          <Button variant="contained" onClick={handleUpload}>
            Upload
          </Button>
        </Stack>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {file && <p>Selected file: {file.name}</p>}
      </div>
      <div className="tile tile2">
        <h2>History</h2>
        {csvHistory.length > 0 ? (
          isEditing ? (
            <Stack spacing={1} direction="row" style={{ flexWrap: 'wrap' }}>
              {csvHistory.map((filename, index) => (
                <Chip
                  key={index}
                  label={filename || 'Unnamed File'}
                  onDelete={handleDeleteChip(filename)}
                  style={{ margin: '4px' }}
                />
              ))}
            </Stack>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {csvHistory.map((filename, index) => (
                <li key={index}>{filename || 'Unnamed File'}</li>
              ))}
            </ul>
          )
        ) : (
          <p>No Past History</p>
        )}
      </div>
      <div className="csvproceed">
        <Stack spacing={3} direction="row" className="stackbox">
          <Button variant="contained" onClick={handleProceedCSV}>
            Proceed
          </Button>
          <Button variant="contained" onClick={handleEditToggle}>
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </Stack>
      </div>
    </div>
  );
};

export default CsvFileUpload;
