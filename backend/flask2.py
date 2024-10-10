from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import great_expectations as ge

app = Flask(__name__)
CORS(app)
#/Users/nithin/Documents/React projects/new1/DQ/files/annual-death.csv
table_names = [
    "toughestsport 1.csv",
    "netflix_titles 2.csv",
    "annual-death.csv",
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
current_table = None  # Global variable to store the current table name

@app.route('/table-list', methods=['GET'])
def get_tables():
    return jsonify({"table": table_names})

@app.route('/send-schema', methods=['POST'])
def send_schema():
    data = request.json
    global current_table  # Use the global variable
    current_table = data.get("table")  # Store the table name

    if not current_table:
        return jsonify({"message": "No table selected"}), 400

    df = pd.read_csv(f"/Users/nithin/Documents/React projects/new1/DQ/files/{current_table}")

    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400

    schema = [{"column": col, "type": str(df[col].dtype)} for col in df.columns]
    return jsonify({"schema": schema, "table": current_table})  # Return the table name along with schema

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

@app.route('/validate_columns', methods=['POST'])
def validate_columns():
    data = request.json
    transformed_data = transform_rules(data)
    global sums
    sums = transformed_data
    print("----------------")
    print(sums)
    print("----------------")
    return jsonify({"status": "success", "message": "Validations received", "data": data})

@app.route('/summaryapi', methods=['GET'])
def get_summary():
    global sums 
    return jsonify({"status": "success", "data": sums})

# Mapping validations to Great Expectations methods
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

expectation_map = {
 'expect_column_values_to_match_regex': lambda df, col, params: df.expect_column_values_to_not_match_regex(col, params['regex_pattern']),
    'expect_column_mean_to_be_between': lambda df, col, params: df.expect_column_mean_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_median_to_be_between': lambda df, col, params: df.expect_column_median_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_stdev_to_be_between': lambda df, col, params: df.expect_column_stdev_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_min_to_be_between': lambda df, col, params: df.expect_column_min_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_max_to_be_between': lambda df, col, params: df.expect_column_max_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_sum_to_be_between': lambda df, col, params: df.expect_column_sum_to_be_between(col, min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_column_values_to_be_in_type_list': lambda df, col, params: df.expect_column_values_to_be_in_type_list(col, params['type_list']),
    'expect_column_values_to_match_json_schema': lambda df, col, params: df.expect_column_values_to_match_json_schema(col, params['json_schema']),
    'expect_multicolumn_values_to_be_unique': lambda df, cols: df.expect_multicolumn_values_to_be_unique(cols),
    'expect_multicolumn_sum_to_equal': lambda df, cols, params: df.expect_multicolumn_sum_to_equal(cols, params['target_value']),
    'expect_table_row_count_to_be_between': lambda df, params: df.expect_table_row_count_to_be_between(min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_table_column_count_to_be_between': lambda df, params: df.expect_table_column_count_to_be_between(min_value=params.get('min_value'), max_value=params.get('max_value')),
    'expect_table_row_count_to_equal': lambda df, params: df.expect_table_row_count_to_equal(params['row_count']),
    'expect_table_columns_to_match_ordered_list': lambda df, params: df.expect_table_columns_to_match_ordered_list(params['column_list']),
    'expect_column_values_to_match_strftime_format': lambda df, col, params: df.expect_column_values_to_match_strftime_format(col, params['strftime_format']),
    'expect_column_value_z_scores_to_be_less_than': lambda df, col, params: df.expect_column_value_z_scores_to_be_less_than(col, params['threshold']),
}

# Apply validations and expectations
# Apply validations and expectations
def apply_validations_and_expectations(df, validations_and_expectations):
    results = []
    df_ge = ge.from_pandas(df)  # Convert dataframe to Great Expectations compatible dataframe

    for rule in validations_and_expectations:
        column = rule.get('column')

        if column is None:
            print(f"Column not found in the rule: {rule}")
            continue

        # Apply global validation rules
        if 'globalRules' in rule:
            for validation in rule['globalRules']:
                validation = validation.lower()
                if validation in validation_map:
                    result = validation_map[validation](df_ge, column)
                    results.append(result.to_json_dict())
                else:
                    print(f"Validation {validation} not found")

        # Apply custom rules (expectations)
        custom_rules = rule.get('customRules', {})
        if not custom_rules:
            print(f"No custom rules found for column: {column}")
            continue

        expectations = custom_rules['expectations']
        for expectation in expectations:
            for expectation_name, params in expectation.items():
                expectation_name = expectation_name.lower()
                if expectation_name in expectation_map:
                    # Handle parameters dynamically for each expectation
                    result = expectation_map[expectation_name](df_ge, column, params)
                    results.append(result.to_json_dict())
                else:
                    print(f"Expectation '{expectation_name}' not found for column: {column}")

    return results
def transform_rules(data):
    def convert_numbers_recursively(item):
        """
        Recursively traverse through dictionaries and lists to convert numeric strings to integers/floats.
        """
        if isinstance(item, dict):
            for key, value in item.items():
                item[key] = convert_numbers_recursively(value)
        elif isinstance(item, list):
            return [convert_numbers_recursively(i) for i in item]
        else:
            # Try to convert strings to integers or floats
            if isinstance(item, str) and item.isdigit():
                return int(item)  # Convert to integer if the string represents an integer
            try:
                return float(item) if isinstance(item, str) else item  # Convert to float if it's a numeric string
            except ValueError:
                return item  # If conversion fails, return the original item

        return item

    # Iterate through each rule in the data and apply the conversion
    for item in data:
        if 'customRules' in item and isinstance(item['customRules'], dict):
            custom_rules = item['customRules']
            
            # Check for expectations and apply conversion
            if 'expectations' in custom_rules:
                expectations = custom_rules['expectations']
                
                # Fix nested 'expectations' issue
                if isinstance(expectations, dict) and 'expectations' in expectations:
                    nested_expectations = expectations.pop('expectations')
                    
                    # Convert the nested expectations to a list if it's a dict
                    if isinstance(nested_expectations, dict):
                        custom_rules['expectations'] = [nested_expectations]
                    else:
                        custom_rules['expectations'] = nested_expectations
                else:
                    # If it's a dict, ensure it's wrapped in a list
                    if isinstance(expectations, dict):
                        custom_rules['expectations'] = [expectations]

                # Now apply the recursive number conversion
                custom_rules['expectations'] = convert_numbers_recursively(custom_rules['expectations'])
                
    return data
# Run validations and expectations
@app.route('/run-validations', methods=['POST'])
def run_validations():
    global current_table  # Use the global variable to access the current table name
    
    if current_table is None:
        return jsonify({"message": "No table selected"}), 400
    
    # Load the selected table dynamically
    print(current_table)
    df = pd.read_csv(f"/Users/nithin/Documents/React projects/new1/DQ/files/{current_table}")
    
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400
    print(sums)
    # Apply validations and expectations from the summary API (sums)
    validation_results = apply_validations_and_expectations(df, sums)
    
    return jsonify({"validation_results": validation_results})

if __name__ == '__main__':
    app.run(debug=True)