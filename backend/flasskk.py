from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

# Store the uploaded DataFrame globally
df = None

# Route to upload the CSV file
@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    global df
    file = request.files.get('file')
    
    if not file:
        return jsonify({"message": "No file uploaded"}), 400

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv(file)
    
    return jsonify({"message": "File uploaded successfully"}), 200


@app.route('/api/send_schema', methods=['GET'])
def send_schema():
    global df
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400


    columns = df.columns.tolist()
    return jsonify({"columns": columns})



@app.route('/api/execute_expectations', methods=['POST'])
def execute_expectations():
    global df
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400

    expectations = request.json  # Expecting a dictionary of expectations
    print('Expectations:', expectations)  # Debugging line

    if not expectations:
        return jsonify({"message": "No expectations provided"}), 400
    
    results = []

    for exp_name, exp in expectations.items():
        column = exp.get('column')
        expectation_type = exp_name.split(' ')[0]  # Extracting the expectation type
        print(f"Processing {expectation_type} for column {column}")  # Debugging line
        
        if not column or not expectation_type:
            results.append({"column": column, "expectation": expectation_type, "success": False, "reason": "Missing data"})
            continue
        
        # Handle different types of expectations
        if expectation_type == 'not_be_null':
            success = df[column].notnull().all()
            results.append({"column": column, "expectation": "not_be_null", "success": success})
        
        elif expectation_type == 'to_be_unique':
            success = df[column].is_unique
            results.append({"column": column, "expectation": "to_be_unique", "success": success})
        
        elif expectation_type == 'to_be_between':
            min_value = exp.get('minValue')
            max_value = exp.get('maxValue')
            
            if min_value is None or max_value is None:
                results.append({"column": column, "expectation": "to_be_between", "success": False, "reason": "Missing min/max values"})
                continue
            
            try:
                min_value = float(min_value)
                max_value = float(max_value)
                success = df[column].between(min_value, max_value).all()
                results.append({"column": column, "expectation": "to_be_between", "success": success})
            except ValueError:
                results.append({"column": column, "expectation": "to_be_between", "success": False, "reason": "Invalid min/max values"})
        
        elif expectation_type == 'column_to_exist':
            success = column in df.columns
            results.append({"column": column, "expectation": "column_to_exist", "success": success})
        
        elif expectation_type == 'to_be_of_type':
            expected_type = exp.get('type')
            if not expected_type:
                results.append({"column": column, "expectation": "to_be_of_type", "success": False, "reason": "Expected type not provided"})
                continue
            
            # Check the dtype of the column
            actual_type = str(df[column].dtype)
            success = actual_type == expected_type
            results.append({"column": column, "expectation": "to_be_of_type", "success": success, "actual_type": actual_type})
    
    return jsonify({"results": results})

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
