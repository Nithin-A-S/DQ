
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import great_expectations as ge

app = Flask(__name__)
CORS(app)

table_names = [
    "toughestsport 1.csv",
    "netflix_titles 2.csv",
    "users.csv",
    "products.csv",
    "orders.csv",
    "categories.csv",
    "customers.csv",
    "invoices.csv",
    "payments.csv",
    "shipments.csv",
    "suppliers.csv",
    "employees.csv"
]

# Global dictionary to store expectations
sums = {}
table=""
# Fetch list of available tables
@app.route('/table-list', methods=['GET'])
def get_tables():
    return jsonify({"table": table_names})

# Fetch schema (columns and types) of the selected table
@app.route('/send-schema', methods=['POST'])
def send_schema():
    data = request.json
    table = data.get("table")
    df = pd.read_csv(f"/Users/nithin/Desktop/DQreact-1/files/{table}")
    
    print(table)
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400
    
    schema = [{"column": col, "type": str(df[col].dtype)} for col in df.columns]
    return jsonify({"schema": schema})

# List of possible expectations/validations
exp = [
    "isemail",
    "isalphabet",
    "isnull",
    "isblank",
    "isboolean",
    "isdecimal",
    "isnegativenumber",
    "ispositivenumber",
    "isnumber",
    "notnull",
    "isunique"
]

@app.route('/exp-list', methods=['GET'])
def get_expectations():
    return jsonify({"exp": exp})

# Store expectations sent from the frontend
@app.route('/validate_columns', methods=['POST'])
def validate_columns():
    data = request.json
    global sums
    sums = data
    return jsonify({"status": "success", "message": "Validations received", "data": data})

# API to return summary of expectations
@app.route('/summaryapi', methods=['GET'])
def get_summary():
    global sums 
    print(sums)
    return jsonify({"status": "success", "data": sums})

# Function to map validations to Great Expectations methods
validation_map = {
    'isemail': lambda df, col: df.expect_column_values_to_match_regex(col, r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'),
    'isalphabet': lambda df, col: df.expect_column_values_to_match_regex(col, r'^[A-Za-z]+$'),
    'isnull': lambda df, col: df.expect_column_values_to_be_null(col),
    'isblank': lambda df, col: df.expect_column_values_to_match_regex(col, r'^\s*$'),
    'isboolean': lambda df, col: df.expect_column_values_to_be_of_type(col, 'bool'),
    'isdecimal': lambda df, col: df.expect_column_values_to_be_of_type(col, 'float'),
    'isnegativenumber': lambda df, col: df.expect_column_values_to_be_less_than(col, 0),
    'ispositivenumber': lambda df, col: df.expect_column_values_to_be_greater_than(col, 0),
    'isnumber': lambda df, col: df.expect_column_values_to_be_of_type(col, 'int'),
    'notnull': lambda df, col: df.expect_column_values_to_not_be_null(col),
    'isunique': lambda df, col: df.expect_column_values_to_be_unique(col),
}

# Map for complex expectations by their names
expectation_map = {
    'expect_column_value_lengths_to_be_between': lambda df, col, params: df.expect_column_value_lengths_to_be_between(col, **params),
    'expect_column_kl_divergence_to_be_less_than': lambda df, col, params: df.expect_column_kl_divergence_to_be_less_than(col, **params),
    'expect_column_values_to_be_in_set': lambda df, col, params: df.expect_column_values_to_be_in_set(col, **params),
    'expect_column_values_to_match_regex': lambda df, col, params: df.expect_column_values_to_match_regex(col, params['regex_pattern']),
    'expect_column_values_to_be_unique': lambda df, col: df.expect_column_values_to_be_unique(col),
    'expect_column_values_to_not_be_null': lambda df, col: df.expect_column_values_to_not_be_null(col),
    'expect_column_values_to_be_of_type': lambda df, col, params: df.expect_column_values_to_be_of_type(col, params['expected_type']),
    'expect_column_values_to_be_between': lambda df, col, params: df.expect_column_values_to_be_between(col, **params),
    'expect_column_pair_values_A_to_be_greater_than_B': lambda df, col, params: df.expect_column_pair_values_A_to_be_greater_than_B(col, params['column_B']),
    'expect_column_pair_values_A_to_be_less_than_B': lambda df, col, params: df.expect_column_pair_values_A_to_be_less_than_B(col, params['column_B']),
}

# Function to apply validations and expectations and return results
def apply_validations_and_expectations(df, validations_and_expectations):
    results = []
    df_ge = ge.from_pandas(df)  # Convert the DataFrame to a Great Expectations DataFrame

    for rule in validations_and_expectations:
        column = rule['column']
        
        # Apply validations
        if 'validations' in rule:
            for validation in rule['validations']:
                validation = validation.lower()  # Normalize to lowercase for consistency
                if validation in validation_map:
                    print(f"Applying validation: {validation} for column: {column}")  # Log validation being applied
                    result = validation_map[validation](df_ge, column)
                    results.append(result.to_json_dict())
                else:
                    print(f"Validation {validation} not found in validation_map")  # Log unknown validation

        # Apply expectations
        if 'expectations' in rule:
            if isinstance(rule['expectations'], dict):  # Handle if expectations is a dict
                for expectation_name, params in rule['expectations'].items():
                    print(f"Applying expectation: {expectation_name} for column: {column} with params: {params}")  # Log expectation being applied
                    if expectation_name in expectation_map:
                        result = expectation_map[expectation_name](df_ge, column, params)
                        results.append(result.to_json_dict())
                    else:
                        print(f"Expectation {expectation_name} not found in expectation_map")  # Log unknown expectation
            elif isinstance(rule['expectations'], list):  # Handle if expectations is a list
                for expectation in rule['expectations']:
                    print(f"Applying expectation: {expectation} for column: {column}")  # Log expectation being applied
                    if expectation in expectation_map:
                        result = expectation_map[expectation](df_ge, column)
                        results.append(result.to_json_dict())
                    else:
                        print(f"Expectation {expectation} not found in expectation_map")  # Log unknown expectation

    return results

# API to perform validation and expectations based on summary
@app.route('/run-validations', methods=['POST'])
def run_validations():
    # data = request.json
    # table = data.get("table")
    global table
    # Load the selected table
    df = pd.read_csv(f"/Users/nithin/Desktop/DQreact-1/files/toughestsport 1.csv")
    
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400
    
    # Apply validations and expectations from the summary API (sums)
    validation_results = apply_validations_and_expectations(df, sums)
    print(sums)
    print(validation_results)
    return jsonify({"validation_results": validation_results})

if __name__ == '__main__':
    app.run(debug=True)