from flask import Flask, request, jsonify
from flask_cors import CORS
from pyspark.sql import SparkSession
import great_expectations as ge
from great_expectations.dataset.sparkdf_dataset import SparkDFDataset
from azure.storage.blob import BlobServiceClient

app = Flask(__name__)
CORS(app)


spark = SparkSession.builder \
    .appName("DataQualityApp") \
    .getOrCreate()
connection_string =
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
container_client = blob_service_client.get_container_client("datasets")
blobs = container_client.list_blobs()


sums = {}
current_table = None
datasets_list=[]
for blob in blobs:
    datasets_list.append(blob.name)


@app.route('/table-list', methods=['GET'])
def get_tables():
    return jsonify({"table": datasets_list})

@app.route('/send-schema', methods=['POST'])
def send_schema():
    data = request.json
    global current_table
    current_table = data.get("table")

    if not current_table:
        return jsonify({"message": "No table selected"}), 400

    df = spark.read.csv(f"C:/Users/asnithin/Documents/DataAccelwerator/DQ/files/{current_table}", header=True, inferSchema=True)

    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400

    schema = [{"column": col, "type": str(df.schema[col].dataType)} for col in df.columns]
    return jsonify({"schema": schema, "table": current_table})

exp = [
    "isemail",
    "isalphabet",
    "isnull",
    "isblank",
    "isboolean",

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
    return jsonify({"status": "success", "message": "Validations received", "data": data})

@app.route('/summaryapi', methods=['GET'])
def get_summary():
    global sums 
    return jsonify({"status": "success", "data": sums})

# Mapping validations to Great Expectations methods for PySpark
validation_map = {
    'isemail': lambda df, col: df.expect_column_values_to_match_regex(col, r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'),
    'isalphabet': lambda df, col: df.expect_column_values_to_match_regex(col, r'^[A-Za-z]+$'),
    'isnull': lambda df, col: df.expect_column_values_to_be_null(col),
    'isblank': lambda df, col: df.expect_column_values_to_match_regex(col, r'^\s*$'),
    'isboolean': lambda df, col: df.expect_column_values_to_be_of_type(col, 'BooleanType'),

    'isnegativenumber': lambda df, col: df.expect_column_values_to_be_less_than(col, 0),
    'ispositivenumber': lambda df, col: df.expect_column_values_to_be_greater_than(col, 0),
    'isnumber': lambda df, col: df.expect_column_values_to_be_of_type(col, 'IntegerType'),
    'notnull': lambda df, col: df.expect_column_values_to_not_be_null(col),
    'isunique': lambda df, col: df.expect_column_values_to_be_unique(col),
}

expectation_map = {
    'expect_column_values_to_match_regex': lambda df, col, params: df.expect_column_values_to_match_regex(col, params['regex_pattern']),
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

# Apply validations and expectations using PySpark DataFrame
def apply_validations_and_expectations(df, validations_and_expectations):
    results = []
    df_ge = SparkDFDataset(df)  # Convert Spark dataframe to Great Expectations compatible dataframe

    for rule in validations_and_expectations:
        column = rule.get('column')

        if column is None:
            print(f"Column not found in the rule: {rule}")
            continue

        if 'globalRules' in rule:
            for validation in rule['globalRules']:
                validation = validation.lower()
                if validation in validation_map:
                    result = validation_map[validation](df_ge, column)
                    results.append(result.to_json_dict())
                else:
                    print(f"Validation {validation} not found")

        custom_rules = rule.get('customRules', {})
        if not custom_rules:
            print(f"No custom rules found for column: {column}")
            continue

        expectations = custom_rules['expectations']
        for expectation in expectations:
            for expectation_name, params in expectation.items():
                expectation_name = expectation_name.lower()
                if expectation_name in expectation_map:
                    result = expectation_map[expectation_name](df_ge, column, params)
                    results.append(result.to_json_dict())
                else:
                    print(f"Expectation '{expectation_name}' not found for column: {column}")
    print(1)
    print(results)
    return results

def transform_rules(data):
    def convert_numbers_recursively(item):
        if isinstance(item, dict):
            for key, value in item.items():
                item[key] = convert_numbers_recursively(value)
        elif isinstance(item, list):
            return [convert_numbers_recursively(i) for i in item]
        else:
            if isinstance(item, str) and item.isdigit():
                return int(item)
            try:
                return float(item) if isinstance(item, str) else item
            except ValueError:
                return item

        return item

    for item in data:
        if 'customRules' in item and isinstance(item['customRules'], dict):
            custom_rules = item['customRules']
            
            if 'expectations' in custom_rules:
                expectations = custom_rules['expectations']
                
                if isinstance(expectations, dict) and 'expectations' in expectations:
                    nested_expectations = expectations.pop('expectations')
                    
                    if isinstance(nested_expectations, dict):
                        custom_rules['expectations'] = [nested_expectations]
                    else:
                        custom_rules['expectations'] = nested_expectations
                else:
                    if isinstance(expectations, dict):
                        custom_rules['expectations'] = [expectations]

                custom_rules['expectations'] = convert_numbers_recursively(custom_rules['expectations'])
                
   

    return data
@app.route('/run-validations', methods=['POST'])
def run_validations():
    global current_table  # Use the global variable to access the current table name
    
    if current_table is None:
        return jsonify({"message": "No table selected"}), 400
    
    # Load the selected table dynamically using PySpark
    print(current_table)
    df = spark.read.csv(f"C:/Users/asnithin/Documents/DataAccelwerator/DQ/files/{current_table}", header=True, inferSchema=True)
    
    if df is None or df.count() == 0:
        return jsonify({"message": "No file uploaded or the file is empty"}), 400
    
    print(sums)  # `sums` contains the validation rules
    
    # Apply validations and expectations from the summary API (`sums`)
    validation_results = apply_validations_and_expectations(df, sums)
    
    return jsonify({"validation_results": validation_results})
if __name__ == '__main__':
    app.run(debug=True)