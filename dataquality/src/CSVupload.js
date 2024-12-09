// CSVUpload.js
import React, { useState, useEffect } from 'react';
import CustomExp from './components/CustomExp';
import SummaryPopup from './components/SummaryPopup';
import { useNavigate } from 'react-router-dom';
import './components/style/CsvUpload.css';


const CSVUpload = () => {
  const [tableList, setTableList] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [schema, setSchema] = useState([]);
  const [expectations] = useState([
    "isEmail", "isAlphabet", "isNull", "isBlank", "isBoolean", "isDecimal", "isNumber", "isUnique"
  ]);
  const [selectedValidations, setSelectedValidations] = useState({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedColumnForPopup, setSelectedColumnForPopup] = useState('');
  const [selectedColumnForSummary, setSelectedColumnForSummary] = useState(null);
  const [columnExpectations, setColumnExpectations] = useState({});
  const [selectedColumnType, setSelectedColumnType] = useState('');
  const [showTables, setShowTables] = useState(false);
  const [columnDataType, setColumnDataType] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const savedValidations = JSON.parse(localStorage.getItem('selectedValidations')) || {};
    const savedExpectations = JSON.parse(localStorage.getItem('columnExpectations')) || {};
    const savedSelectedTable = localStorage.getItem('selectedTable');
    
    setSelectedValidations(savedValidations);
    setColumnExpectations(savedExpectations);
    setSelectedTable(savedSelectedTable || '');
    
    console.log('Loaded from localStorage:', { savedValidations, savedExpectations, savedSelectedTable });
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedValidations', JSON.stringify(selectedValidations));
  }, [selectedValidations]);

  useEffect(() => {
    localStorage.setItem('columnExpectations', JSON.stringify(columnExpectations));
  }, [columnExpectations]);

  useEffect(() => {
    localStorage.setItem('selectedTable', selectedTable);
  }, [selectedTable]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/table-list')
      .then(response => response.json())
      .then(data => {
        setTableList(data.table);
      })
      .catch(error => console.error('Error fetching table list:', error));
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetch('http://127.0.0.1:5000/send-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: selectedTable }),
      })
      .then(response => response.json())
      .then(data => {
        setSchema(data.schema);

        const updatedValidations = {};
        const updatedExpectations = {};
        const updatedColumnTypes = {};
        data.schema.forEach(col => {
          updatedValidations[col.column] = selectedValidations[col.column] || [];
          updatedExpectations[col.column] = columnExpectations[col.column] || [];
          updatedColumnTypes[col.column] = col.type; // Store the data type
        });

        setSelectedValidations(updatedValidations);
        setColumnExpectations(updatedExpectations);
        setColumnDataType(updatedColumnTypes); // Set column data types

        console.log('Updated Validations and Expectations after schema fetch:', { updatedValidations, updatedExpectations });
      })
      .catch(error => console.error('Error fetching schema:', error));
    }
  }, [selectedTable]);

  const handleValidationChange = (column, validation) => {
    setSelectedValidations(prevState => {
      const columnValidations = prevState[column] || [];
      const isChecked = columnValidations.includes(validation);
      return {
        ...prevState,
        [column]: isChecked
          ? columnValidations.filter(v => v !== validation)
          : [...columnValidations, validation]
      };
    });
  };

  const handleNextClick = () => {
    const validationData = schema
      .map(col => ({
        column: col.column,
        globalRules: selectedValidations[col.column] || [],  // Rename validations to globalRules
        customRules: {  // Rename expectations to customRules
          column: col.column,
          expectations: columnExpectations[col.column] || {}
        }
      }))
      .filter(col => col.globalRules.length > 0 || Object.keys(col.customRules.expectations).length > 0);

    console.log('Global Rules and Custom Rules Data:', validationData);

    navigate('/explist', { state: { summaryData: validationData } });

    fetch('http://127.0.0.1:5000/validate_columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validationData),
    })
    .then(response => response.json())
    .then(data => console.log('Submitted data:', data))
    .catch(error => console.error('Error submitting data:', error));
  };

  const openPopup = (column, type) => {
    setSelectedColumnForPopup(column);
    setSelectedColumnType(type);
    setPopupOpen(true);
  };

  const openSummary = (column) => {
    setSelectedColumnForSummary(column);
    setSummaryOpen(true);
  };

  const savePopupExpectations = (newExpectations) => {
    setColumnExpectations(prevState => ({
      ...prevState,
      [selectedColumnForPopup]: {
        ...prevState[selectedColumnForPopup], 
        ...newExpectations // Merge new expectations
      }
    }));
  };

  const handleDataTypeChange = (column, newType) => {
    setColumnDataType(prevState => ({
      ...prevState,
      [column]: newType
    }));
  };

  const handleShowTables = () => {
    setShowTables(true);
  };

  return (
    <div className="csvupload-main-box">
      <div className="csvupload-container">
        <div className="csvupload-table-list">
          <h2>Select Tables</h2>
          <button className="csvupload-nav-button " onClick={handleShowTables}>Show Tables</button>
          {showTables && (
            <ul className="table-items">
              {tableList.map((table, index) => (
                <li
                  key={index}
                  className={`table-item ${selectedTable === table ? 'selected' : ''}`}
                  onClick={() => setSelectedTable(table)}
                >
                  {table}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="csvupload-schema-section">
          <div className="csvupload-scroll-box">
            <table>
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Global Rules</th>
                  <th>Custom rules</th>
                  <th>Rules Summary</th>
                </tr>
              </thead>
              <tbody>
                {schema.length > 0 ? (
                  schema.map((col, index) => (
                    <tr key={index}>
                      <td>{col.column}</td>
                      <td>
                        <select
                          value={columnDataType[col.column] || ''}
                          onChange={(e) => handleDataTypeChange(col.column, e.target.value)}
                        >
                          <option value="string">String</option>
                          <option value="integer">Integer</option>
                          <option value="float">Float</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </td>
                      <td>
                        <div className="csvupload-rules-box">
                          {expectations.map((exp, expIndex) => (
                            <label key={expIndex} className="csvupload-rule-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedValidations[col.column]?.includes(exp) || false}
                                onChange={() => handleValidationChange(col.column, exp)}
                              />
                              {exp}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button className="csvupload-button-37" onClick={() => openPopup(col.column, columnDataType[col.column])}>Add</button>
                       
                      </td>
                      <td> <button className="csvupload-button-37" onClick={() => openSummary(col)}>Summary</button></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No schema available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="-csvuploadbutton-group">
        <button className="csvupload-nav-button" variant="contained" onClick={handleNextClick}>Next</button>
      </div>

      <CustomExp
        trigger={popupOpen}
        setTrigger={setPopupOpen}
        saveExpectations={savePopupExpectations}
        column={selectedColumnForPopup}
        columnType={selectedColumnType}
      />

      {summaryOpen && selectedColumnForSummary && (
        <SummaryPopup
          trigger={summaryOpen}
          setTrigger={setSummaryOpen}
          selectedColumn={selectedColumnForSummary}
          selectedValidations={selectedValidations}
          columnExpectations={columnExpectations}
        />
      )}
    </div>
  );
};

export default CSVUpload;
