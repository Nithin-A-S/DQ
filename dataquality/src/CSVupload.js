import React, { useState, useEffect } from 'react';
import './App.css';
import CustomExp from './components/CustomExp';
import SummaryPopup from './components/SummaryPopup';
import { useNavigate } from 'react-router-dom';

const App = () => {
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
  const [showTables, setShowTables] = useState(false);
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
        data.schema.forEach(col => {
          updatedValidations[col.column] = selectedValidations[col.column] || [];
          updatedExpectations[col.column] = columnExpectations[col.column] || [];
        });

        setSelectedValidations(updatedValidations);
        setColumnExpectations(updatedExpectations);
        
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

  const openPopup = (column) => {
    setSelectedColumnForPopup(column);
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
        ...prevState[selectedColumnForPopup], // Keep the existing expectations for this column
        ...newExpectations // Merge new expectations
      }
    }));
  };
  const handleShowTables = () => {
    setShowTables(true);
  };

  return (
    <div className="main-box">
      <div className="container">
        <div className="table-list">
          <h2>Select Tables</h2>
          <button className="nav-button " onClick={handleShowTables}>Show Tables</button>
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

        <div className="schema-section">
          <h2>Default validations</h2>
          <div className="scroll-box">
            <table>
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Global Rules</th>
                  <th>Custom rules</th>
                </tr>
              </thead>
              <tbody>
                {schema.length > 0 ? (
                  schema.map((col, index) => (
                    <tr key={index}>
                      <td>{col.column}</td>
                      <td>{col.type}</td>
                      <td>
                        <div className="rules-box">
                          {expectations.map((exp, expIndex) => (
                            <label key={expIndex} className="rule-checkbox">
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
                        <button className="button-37" onClick={() => openPopup(col.column)}>Add</button>
                        <button className="button-37" onClick={() => openSummary(col)}>Summary</button>
                      </td>
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

      <div className="button-group">
        <button className="nav-button" onClick={handleNextClick}>Next</button>
      </div>

      <CustomExp
        trigger={popupOpen}
        setTrigger={setPopupOpen}
        saveExpectations={savePopupExpectations}
        column={selectedColumnForPopup}
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

export default App;