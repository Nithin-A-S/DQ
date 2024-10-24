
import React, { useState, useEffect } from 'react';
import './App.css';
import CustomExp from './components/CustomExp';
import Summary from './components/Summary';
import { useNavigate } from 'react-router-dom';

const App = () => {
  const [tableList, setTableList] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [schema, setSchema] = useState([]);
  const [expectations] = useState([
    "isEmail", "isAlphabet", "isNull", "isBlank", "isBoolean", "isDecimal", "isNegativeNumber", "isPositiveNumber", "isNumber", "isUnique"
  ]);
  const [selectedValidations, setSelectedValidations] = useState({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [popsum, setPopsum] = useState(false);
  const [selectedColumnForPopup, setSelectedColumnForPopup] = useState('');
  const [columnExpectations, setColumnExpectations] = useState({});
  const navigate = useNavigate(); 

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedValidations = JSON.parse(localStorage.getItem('selectedValidations'));
    const savedExpectations = JSON.parse(localStorage.getItem('columnExpectations'));

    if (savedValidations) {
      setSelectedValidations(savedValidations);
    }

    if (savedExpectations) {
      setColumnExpectations(savedExpectations);
    }
  }, []);

  // Save validations and expectations in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedValidations', JSON.stringify(selectedValidations));
  }, [selectedValidations]);

  useEffect(() => {
    localStorage.setItem('columnExpectations', JSON.stringify(columnExpectations));
  }, [columnExpectations]);

  // Fetch the list of tables on component mount
  useEffect(() => {
    fetch('http://127.0.0.1:5000/table-list')
      .then(response => response.json())
      .then(data => {
        setTableList(data.table);
        if (data.table.length > 0) {
          setSelectedTable(data.table[0]);
        }
      })
      .catch(error => console.error('Error fetching table list:', error));
  }, []);

  // Fetch schema when a table is selected
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
        const initialValidations = {};
        const initialExpectations = {};
        data.schema.forEach(col => {
          initialValidations[col.column] = [];
          initialExpectations[col.column] = [];
        });
        setSelectedValidations(initialValidations);
        setColumnExpectations(initialExpectations);
      })
      .catch(error => console.error('Error fetching schema:', error));
    }
  }, [selectedTable]);

  // Handle checkbox toggle for validations
  const handleValidationChange = (column, validation) => {
    setSelectedValidations(prevState => {
      const columnValidations = prevState[column] || [];
      if (columnValidations.includes(validation)) {
        return {
          ...prevState,
          [column]: columnValidations.filter(v => v !== validation)
        };
      } else {
        return {
          ...prevState,
          [column]: [...columnValidations, validation]
        };
      }
    });
  };

  // Handle "Next" button click
  const handleNextClick = () => {
    const validationData = schema
      .map(col => ({
        column: col.column,
        validations: selectedValidations[col.column] || [],
        expectations: columnExpectations[col.column] || [],
      }))
      .filter(col => col.validations.length > 0 || col.expectations.length > 0);

    console.log('Validation and Expectations Data:', validationData);
    
    // Pass validation data through navigation state
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

  const openPopsum = (column) => {
    setPopsum(true);
  };

  // Save expectations from popup
  const savePopupExpectations = (newExpectations) => {
    setColumnExpectations(prevState => ({
      ...prevState,
      [selectedColumnForPopup]: newExpectations.expectations,
    }));
  };

  return (
    <div className="main-box">
      <div className="container">
        <div className="table-list">
          <h2>Select Tables</h2>
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
        </div>

        <div className="schema-section">
          <h2>Default validations</h2>
          <div className="scroll-box">
            <table>
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Validations</th>
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
                        <button className="button-show" onClick={() => openPopsum()}>Summary</button>
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
      <Summary
        trigger={popsum}
        setTrigger={setPopsum}
      />
    </div>
  );
};

export default App;
