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
MONGO_CONN_STRING = "mongodb+srv://datamaccount:dataacc1234@clustermaccel.n4dwyfo.mongodb.net/?retryWrites=true&w=majority&appName=clustermaccel"
AZURE_CONTAINER_NAME = "datasets"

# Initialize MongoDB
client = MongoClient(MONGO_CONN_STRING)
database = client["csvfolder"]
tasks_collection = database["DQ-datasets"]
users_collection = database.get_collection("DQ-users")


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


@app.route('/register-user', methods=['POST'])
def register_user():
    try:
        req_body = request.json
        print(type(req_body),req_body)
        req_body['connection_string'] = ''
        req_body['access_key']=''
        users_collection.insert_one(req_body)            
        print("User Data Stored Successfully in the Database.")
        return jsonify({"message": "User's Credentials Registered"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Routes
@app.route('/read-users',methods=['GET'])
def read_users():
    resp = {}
    try:
        users = users_collection.find({})
        output = [{'email' : user['email'], 'pass' : user['password']} for user in users]   #list comprehension
        resp['data'] = output
        print(resp)
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    print("---THIS IS SUMS",sums)
    return jsonify({"status": "success", "data": sums})



@app.route('/run-validations', methods=['POST'])
def run_validations():
    if current_table is None:
        return jsonify({"message": "No table selected"}), 400

    if df is None or df.count() == 0:
        return jsonify({"message": "No file uploaded or the file is empty"}), 400
    print("abcdefgh",df)
    print("++++++++",sums)

    validation_results = apply_validations_and_expectations(df, sums)
    return jsonify({"validation_results": validation_results})

@app.route('/check-conn', methods=['GET'])
def check_connection():
    print("-->",user_session)
    global azure_conn_string
    if not user_session:
        return jsonify({"success": False, "message": "User session is not available"}), 400
    
    user = users_collection.find_one({"email": user_session["user_id"]})
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    if "connection_string" not in user or not user["connection_string"]:
        return jsonify({"success": False, "message": "Connection string is not available for the user."}), 400
    
    azure_conn_string = user["connection_string"]
    try:
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn_string)
        containers = blob_service_client.list_containers()
        container_names = [container["name"] for container in containers]
        return jsonify({
            "success": True, 
            "connectionString": azure_conn_string, 
            "containers": container_names
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Error connecting to Azure: {str(e)}"}), 500

# @app.route('/connect', methods=['POST'])
# def connect_azure():
#     print(user_session)

#     global azure_conn_string
#     data = request.json
#     azure_conn_string = data.get('connection_string')
#     print(azure_conn_string,type(azure_conn_string))
#     if not azure_conn_string:
#         return jsonify({'success': False, 'message': 'Connection string is missing'}), 400

#     try:
#         # Save the connection string to MongoDB for the current user
#         user = users_collection.find_one({'email':user_session["user_id"]}) 
#         print("++++",user)
#         # Replace this with a condition to identify the current user (e.g., user_id)
#         if user:
#             users_collection.update_one(
#                 {'email':user_session["user_id"]},  # Ensure you're updating the correct user
#                 {'$push': {'connection_string': azure_conn_string}}
@app.route('/connect', methods=['POST'])
def connect_azure():
    global azure_conn_string
    
    # Assume `user_session` contains the logged-in user's email as `user_id`
    user_email = user_session.get("user_id")
    if not user_email:
        return jsonify({'success': False, 'message': 'User session is invalid'}), 401

    # Parse the JSON request to get the connection string
    data = request.json
    azure_conn_string = data.get('connection_string')
    
    if not azure_conn_string:
        return jsonify({'success': False, 'message': 'Connection string is missing'}), 400

    try:
        # Check if the user exists in MongoDB
        user = users_collection.find_one({'email': user_email})

        if user:
            # Update the connection_string field for the user
            users_collection.update_one(
                {'email': user_email},
                {'$set': {'connection_string': azure_conn_string}}  # Use `$set` to overwrite the field
            )
            return jsonify({'success': True, 'message': 'Connection string updated successfully'}), 200

        # Try to connect to Azure with the provided connection string
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn_string)
        containers = blob_service_client.list_containers()
        container_names = [container['name'] for container in containers]

        return jsonify({
            'success': True,
            'containers': container_names
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    global azure_conn_string, current_table, sums, df, datasets_list
    azure_conn_string = None
    current_table = None
    sums = {}
    df = None
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

@app.route('/get-user-data', methods=['POST'])
def get_user_data():
    try:

        req_data = request.json
        print("------------->")
        
        username = user_session.get("user_id")
        print(username)
        if not username:
            return jsonify({"error": "Username is required"}), 400

        user_data = tasks_collection.find_one({"username": username},{"username": 1, "csvfiles": 1, "_id": 0})  # Projection: include only specific fields
        print(user_data)
        if not user_data:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "username": user_data["username"],
            "csvfiles": user_data["csvfiles"]
            
        }), 200
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data-dataset-upload', methods=['POST'])
def upload_file():
    global df
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
 
    file = request.files['file']
    # username = request.form.get('username')  # Expecting username as part of the form data
    username = user_session.get("user_id")
    if not username:
        return jsonify({"error": "Username is required"}), 400
 
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
 
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file type"}), 400
 
        # Convert DataFrame to dictionary
        data = df.to_dict(orient='records')
 
        # Use projection to retrieve only username and csvfiles
        existing_user = tasks_collection.find_one(
            {"username": username},
            {"username": 1, "csvfiles": 1}  # Projection: Include only username and csvfiles
        )
 
        if existing_user:
            tasks_collection.update_one(
                {"username": username},
                {
                    "$addToSet": {"csvfiles": file.filename},  # Ensure no duplicates in csvfiles
                    "$push": {"data": data}  # Append data as a new list
                }
            )
            message = "File and data appended to existing user."
        else:
            new_document = {
                "username": username,
                "csvfiles": [file.filename],
                "data": [data]
            }
            tasks_collection.insert_one(new_document)
            message = "New user created, and data stored successfully."
 
        return jsonify({"message": message}), 200
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/data-removedata', methods=['POST'])
def removedata():
    try:
        # Parse the request JSON
        request_data = request.json
        username = user_session.get("user_id")
        # username = request_data.get('username')
        files_to_remove = request_data.get('csvfiles', [])
 
        if not username or not files_to_remove:
            return jsonify({"error": "Missing username or csvfiles in request."}), 400
 
        # Find the document for the given username
        user_doc = tasks_collection.find_one({"username": username})
 
        if not user_doc:
            return jsonify({"error": "User not found."}), 404
 
        # Update the csvfiles and data fields by removing specified files and their corresponding data
        csvfiles = user_doc.get('csvfiles', [])
        data = user_doc.get('data', [])
 
        for file in files_to_remove:
            if file in csvfiles:
                index = csvfiles.index(file)
                csvfiles.pop(index)
                data.pop(index)
 
        # Update the document in MongoDB
        tasks_collection.update_one(
            {"username": username},
            {"$set": {"csvfiles": csvfiles, "data": data}}
        )
 
        return jsonify({"message": "Files and data removed successfully.", "removedFiles": files_to_remove}), 200
 
    except Exception as e:
        return jsonify({"error": "An error occurred.", "details": str(e)}), 500
    
@app.route('/data-send-schema', methods=['POST'])
def data_send_schema():
    data = request.json
    current_user = data.get('username')  # username
    current_table = data.get('csvfiles')  # csvfile name
    print(current_user,current_table)
   
    if not current_table or not current_user:
        return jsonify({"message": "Username and table (csvfile) are required"}), 400
   
    document = tasks_collection.find_one(
        {"username": current_user},
        {"csvfiles": 1, "data": 1, "_id": 0}  # Only include necessary fields
    )
   
    if not document:
        return jsonify({"message": f"User '{current_user}' not found"}), 404
   
    try:
        csvfile_index = document['csvfiles'].index(current_table)
    except ValueError:
        return jsonify({"message": f"CSV file '{current_table}' not found for user '{current_user}'"}), 404
   
    all_data = document['data'][csvfile_index]
 
    # Print the extracted data for debugging
    print("All data retrieved from MongoDB:", all_data, type(all_data), sep='\n')
   
    # Create a pandas DataFrame if data is available
    global df
    df = spark.createDataFrame(all_data)
    print("hiiiiiiiiiiiiiiiii",df.printSchema())
    print("headddddd",df.head())
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400
 
    schema = [{"column": col, "type": str(df.schema[col].dataType)} for col in df.columns]
    print("seufefefhefuefue",schema)
    print(df)
    return jsonify({"schema": schema, "table": current_table})
 
 
user_session = {"user_id": None}  # Global variable to store user session

@app.route('/userID-fetch', methods=['POST'])
def set_user_id():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user_session['user_id'] = email
    print(email)
    return jsonify({"message": "User ID set successfully", "user_id": email}), 200

@app.route('/userID-delete', methods=['DELETE'])
def clear_user_id():
    user_session['user_id'] = None
    return jsonify({"message": "User ID cleared successfully"}), 200

@app.route('/get-user-id', methods=['GET'])
def get_user_id():
    user_id = user_session.get('user_id')
    if not user_id:
        return jsonify({"error": "No user logged in"}), 400
    return jsonify({"user_id": user_id}), 200


if __name__ == '__main__':
    app.run(debug=True)
