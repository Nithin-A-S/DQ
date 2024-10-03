import React from 'react';


const Summary = ({ trigger, setTrigger, expectations, column }) => {
  const handleClose = () => {
    setTrigger(false);
  };

  return trigger ? (
    <div className="popup">
      <div className="popup-inner">
        
        <h2>Expectation Summary for {column}</h2>
        <ul>
  {expectations && expectations.length > 0 ? (
    expectations.map((exp, index) => (
      <li key={index}>
        {exp.selected 
          ? `Expectation: ${exp.selected}` 
          : "No expectation selected for this entry."}
      </li>
    ))
  ) : (
    <li>No expectations added.</li>
  )}
</ul>

        <button className="close-btn" onClick={handleClose}>Close</button>
      </div>
    </div>
  ) : null;
};

export default Summary;
