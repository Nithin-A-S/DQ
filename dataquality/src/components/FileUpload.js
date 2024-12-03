import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useNavigate } from 'react-router-dom';
import './style/FileUpload.css';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log('This is the file info : ' + selectedFile);
    
    if (selectedFile) {
      // Check if the file type is allowed
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Invalid file type. Only .csv and .xlsx files are allowed.');
      }
    }
  };


  const handleUpload = () => {
    if (file) {
      console.log('File ready to upload:', file);
  
      // Create a new FormData object to hold the file
      const formData = new FormData();
      formData.append('file', file);
  
      fetch('http://127.0.0.1:5000/dataset-upload', {
        method: 'POST',
        body: formData, 
        headers: {
          'Accept': 'application/json'
        }// Send the FormData object containing the file
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
          navigate('/');
        })
        .catch((error) => {
          console.error('Error uploading file:', error);
          alert('Error uploading file. Please try again.');
        });
    } else {
      alert('No valid file selected.');
    }
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
        <p>Connect using Azure</p>
      </div>
    </div>
  );
}

export default FileUpload;
