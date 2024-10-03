import React, { useState, useEffect } from 'react';
import './style/CustomExp.css';

const expectationsList = [
  { id: 1, name: 'expect_column_values_to_be_between', inputs: ['min_value', 'max_value'] },
  { id: 2, name: 'expect_column_values_to_be_in_set', inputs: ['value_set'] },
  { id: 3, name: 'expect_column_pair_values_A_to_be_greater_than_B', inputs: ['column_B'] },
  { id: 4, name: 'expect_column_values_to_match_regex', inputs: ['regex_pattern'] },
  { id: 5, name: 'expect_column_value_lengths_to_be_between', inputs: ['min_length', 'max_length'] },
  { id: 6, name: 'expect_column_values_to_be_unique', inputs: [] },
  { id: 7, name: 'expect_column_values_to_not_be_null', inputs: [] },
  { id: 8, name: 'expect_column_kl_divergence_to_be_less_than', inputs: ['max_kl_divergence'] },
  { id: 9, name: 'expect_column_sum_to_equal', inputs: ['expected_sum'] },
  { id: 10, name: 'expect_column_value_lengths_to_equal', inputs: ['length'] },
  { id: 11, name: 'expect_column_values_to_be_of_type', inputs: ['expected_type'] },
  { id: 12, name: 'expect_column_pair_values_A_to_be_less_than_B', inputs: ['column_B'] }
];

function CustomExp({ trigger, setTrigger, saveExpectations, column }) {  
  const [expectations, setExpectations] = useState([]);
  const [formInputs, setFormInputs] = useState({});

  useEffect(() => {
    if (trigger) {
      setExpectations([]);
      setFormInputs({});
    }
  }, [trigger]);

  // Handle adding a new expectation to the list
  const handleAddExpectation = () => {
    setExpectations([...expectations, { id: expectations.length, selected: '' }]);
  };

  // Handle selecting an expectation
  const handleSelectExpectation = (index, expectationName) => {
    const updatedExpectations = [...expectations];
    updatedExpectations[index].selected = expectationName;
    setExpectations(updatedExpectations);

    // Ensure we have an entry for this expectation in formInputs
    setFormInputs(prevInputs => ({
      ...prevInputs,
      [expectationName]: {}  // Initialize with an empty object for inputs
    }));
  };

  // Handle form input changes for specific expectation
  const handleInputChange = (expectationName, inputName, value) => {
    setFormInputs(prevInputs => ({
      ...prevInputs,
      [expectationName]: {
        ...prevInputs[expectationName],
        [inputName]: value
      }
    }));
  };

  const handleClosePopup = () => {
    setTrigger(false);
  };

  const handleFinish = () => {
    saveExpectations({ column, expectations: formInputs });  // Return expectation names with input values
    setTrigger(false);
  };

  return trigger ? (
    <div className="popup">
      <div className="popup-inner">
        <h2>Expectation Configuration for {column}</h2> {/* Display column name */}
        
        {/* Scrollable container for the expectations */}
        <div className="expectation-list-container">
          {expectations.map((exp, index) => (
            <div key={index} className="expectation-item">
              <label className='exp-lable'>Select Expectation:</label>
              <select 
                value={exp.selected}
                onChange={(e) => handleSelectExpectation(index, e.target.value)}
              >
                <option value="">-- Select Expectation --</option>
                {expectationsList.map((expOption) => (
                  <option key={expOption.id} value={expOption.name}>
                    {expOption.name}
                  </option>
                ))}
              </select>
  
              {/* Dynamically render inputs based on selected expectation */}
              {exp.selected && expectationsList.find(e => e.name === exp.selected).inputs.map((inputName) => (
                <div key={inputName} className="input-field">
                  <label>{inputName.replace('_', ' ')}:</label>
                  <input
                    type="text"
                    value={formInputs[exp.selected]?.[inputName] || ''}
                    onChange={(e) => handleInputChange(exp.selected, inputName, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
  
        <button className="add-btn" onClick={handleAddExpectation}>
          + Add Expectation
        </button>
  
        <div className="popup-buttons">
          <button className="close-btn" onClick={handleClosePopup}>Close</button>
          <button className="finish-btn" onClick={handleFinish}>Finish</button>
        </div>
      </div>
    </div>
  ) : null;
}

export default CustomExp;