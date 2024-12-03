from flask import Flask, request, jsonify
from flask_cors import CORS
from pyspark.sql import SparkSession
import great_expectations as ge
from great_expectations.dataset.sparkdf_dataset import SparkDFDataset
from azure.storage.blob import BlobServiceClient
from pymongo import MongoClient
import tempfile
import pandas as pd

# Constants
MONGO_CONN_STRING = ""
AZURE_CONTAINER_NAME = "datasets"

# Initialize MongoDB
client = MongoClient(MONGO_CONN_STRING)
database = client["csvfolder"]
tasks_collection = database["DQ"]

# Initialize Flask app and Spark session
app = Flask(__name__)
CORS(app)
spark = SparkSession.builder.appName("DataQualityApp").getOrCreate()

# Globals
azure_conn_string = None
current_table = None
datasets_list = []
sums = {}
df = pd.DataFrame()

# Routes
@app.route('/table-list', methods=['GET'])
def get_tables():
    try:
        if azure_conn_string is None:
            return jsonify({"message": "Azure connection string not set"}), 400

        # Create Blob Service Client
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn_string)
        container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

        # List Blobs in Container
        blobs = container_client.list_blobs()
        datasets_list = [blob.name for blob in blobs]

        # Log and Return Data
        print("Blobs Found:", datasets_list)
        return jsonify({"table": datasets_list}), 200
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"message": "Failed to fetch tables", "error": str(e)}), 500

    
    


@app.route('/send-schema', methods=['POST'])
def send_schema():
    data = request.json
    global current_table, df

    current_table = data.get("table")
    if not current_table:
        return jsonify({"message": "No table selected"}), 400

    try:
        # Initialize Azure Blob client
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn_string)
        container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)
        blob_client = container_client.get_blob_client(current_table)
        
        # Download the blob data
        file_data = blob_client.download_blob().readall()
        
        # Create a temporary file to store the downloaded data
        with tempfile.NamedTemporaryFile(delete=False, mode='wb') as tmp_file:
            tmp_file.write(file_data)
            tmp_file_path = tmp_file.name

        # Check file type and load into Spark DataFrame
        if current_table.endswith(".csv"):
            df = spark.read.option("header", "true").csv(tmp_file_path)
        elif current_table.endswith(".parquet"):
            df = spark.read.parquet(tmp_file_path)
        else:
            return jsonify({"message": "Unsupported file type"}), 400

        # Generate schema
        schema = [{"column": col.name, "type": str(col.dataType)} for col in df.schema.fields]
        return jsonify({"schema": schema, "table": current_table})
    
    except Exception as e:
        return jsonify({"message": str(e)}), 500



@app.route('/exp-list', methods=['GET'])
def get_expectations():
    exp = [
        "isemail", "isalphabet", "isnull", "isblank", "isboolean",
        "isnegativenumber", "ispositivenumber", "isnumber", "notnull", "isunique"
    ]
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
    return jsonify({"status": "success", "data": sums})


@app.route('/run-validations', methods=['POST'])
def run_validations():
    if current_table is None:
        return jsonify({"message": "No table selected"}), 400

    if df is None or df.count() == 0:
        return jsonify({"message": "No file uploaded or the file is empty"}), 400

    validation_results = apply_validations_and_expectations(df, sums)
    return jsonify({"validation_results": validation_results})


@app.route('/connect-azure', methods=['POST'])
def connect_azure():
    global azure_conn_string
    data = request.json
    azure_conn_string = data.get('connection_string')
    print("11223")
    print(azure_conn_string)

    if not azure_conn_string:
        return jsonify({'success': False, 'message': 'Connection string is missing'}), 400

    try:
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn_string)
        containers = blob_service_client.list_containers()
        container_names = [container['name'] for container in containers]
        return jsonify({'success': True, 'containers': container_names})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/logout', methods=['POST'])
def logout():
    global azure_conn_string, current_table, sums, df, datasets_list
    azure_conn_string = None
    current_table = None
    sums = {}
    df = pd.DataFrame()
    datasets_list = []
    return jsonify({'success': True})


# Helper Functions
def apply_validations_and_expectations(df, validations_and_expectations):
    results = []
    df_ge = SparkDFDataset(df)

    for rule in validations_and_expectations:
        column = rule.get('column')
        if not column:
            continue

        globalRules = rule.get('globalRules', [])
        for validation in globalRules:
            validation_func = validation_map.get(validation.lower())
            if validation_func:
                result = validation_func(df_ge, column)
                results.append(result.to_json_dict())

        customRules = rule.get('customRules', {}).get('expectations', [])
        for expectation in customRules:
            for expectation_name, params in expectation.items():
                expectation_func = expectation_map.get(expectation_name.lower())
                if expectation_func:
                    result = expectation_func(df_ge, column, params)
                    results.append(result.to_json_dict())

    return results


def transform_rules(data):
    for item in data:
        custom_rules = item.get('customRules', {})
        if 'expectations' in custom_rules and isinstance(custom_rules['expectations'], dict):
            custom_rules['expectations'] = [custom_rules['expectations']]
    return data


# Validation and Expectation Mappings
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

if __name__ == '__main__':
    app.run(debug=True)
