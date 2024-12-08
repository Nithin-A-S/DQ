from flask import Flask, request, jsonify
from flask_cors import CORS
from pyspark.sql import SparkSession 
import great_expectations as ge
# from great_expectations.dataset.sparkdf_dataset import SparkDFDataset
import pandas as pd
# import aiofiles
# from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
# import io
import gridfs

app = Flask(__name__)
CORS(app)

# Initialize Spark session
spark = SparkSession.builder \
    .appName("DataQualityApp") \
    .getOrCreate()


# table_names = [
#     "toughestsport 1.csv",
#     "netflix_titles 2.csv",
#     "annual-death.csv",
#     "users.csv",
#     "products.csv",
#     "orders.csv",
#     "categories.csv",
#     "customers.csv",
#     "invoices.csv",
#     "payments.csv",
#     "shipments.csv",
#     "suppliers.csv",
#     "employees.csv"
# ]

table_names = []
sums = {}
current_table = None


#MongoDB Connectivity
con_string = "mongodb+srv://datamaccount:dataacc1234@clustermaccel.n4dwyfo.mongodb.net/?retryWrites=true&w=majority&appName=clustermaccel"
# client = AsyncIOMotorClient(con_string)
client = MongoClient(con_string)
database = client.get_database("csvfolder")
tasks_collection = database.get_collection("DQ-datasets")
users_collection = database.get_collection("DQ-users")
# fs = gridfs.GridFS(database)




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


@app.route('/get-user-data', methods=['POST'])
def get_user_data():
    try:
        # Extract username from the request body
        req_data = request.json
        print(req_data)
        username = req_data.get('username')

        if not username:
            return jsonify({"error": "Username is required"}), 400

        # Query the MongoDB collection to find the document for the user
        user_data = tasks_collection.find_one({"username": username},{"username": 1, "csvfiles": 1, "_id": 0})  # Projection: include only specific fields
        print(user_data)
        if not user_data:
            return jsonify({"error": "User not found"}), 404

        # Return the user's data as JSON
        return jsonify({
            "username": user_data["username"],
            "csvfiles": user_data["csvfiles"]
            # "data": user_data["data"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
#For Single user
#Existing Records Fetch
# @app.route('/data-table-list', methods=['GET'])
# def get_tables_azure():
#     # Read table names from MONGODB
#     for i in tasks_collection.find():
#         table_names.append(i['filename'])
#     return jsonify({"table": table_names})


@app.route('/data-dataset-upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    username = request.form.get('username')  # Expecting username as part of the form data

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
        username = request_data.get('username')
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
def send_schema():
    data = request.json
    current_user = data.get('username')  # username
    current_table = data.get('csvfiles')  # csvfile name
    # print(current_user,current_table)
    
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
    pandas_df = pd.DataFrame(all_data)
    print(pandas_df.info())
    df = spark.createDataFrame(pandas_df)
    print(df.printSchema())
    if df is None:
        return jsonify({"message": "No file uploaded yet"}), 400

    schema = [{"column": col, "type": str(df.schema[col].dataType)} for col in df.columns]
    print(schema)
    return jsonify({"schema": schema, "table": current_table})


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
    'isdecimal': lambda df, col: df.expect_column_values_to_be_of_type(col, 'DoubleType'),
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
    'expect_column_z_scores_to_be_less_than': lambda df, col, params: df.expect_column_z_scores_to_be_less_than(col, params['threshold']),
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
    print(results,sep='\n')
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
@app.route('/data-run-validations', methods=['POST'])
def run_validations():
    global current_table  # Use the global variable to access the current table name
    
    if current_table is None:
        return jsonify({"message": "No table selected"}), 400
    
    # Load the selected table dynamically using PySpark
    print(current_table)
    df = spark.read.csv(f"D:/KaarMaterials/Data Domain/POC/Data Quality/DQ/files/{current_table}", header=True, inferSchema=True)
    
    if df is None or df.count() == 0:
        return jsonify({"message": "No file uploaded or the file is empty"}), 400
    
    print(sums)  # `sums` contains the validation rules
    
    # Apply validations and expectations from the summary API (`sums`)
    validation_results = apply_validations_and_expectations(df, sums)
    
    return jsonify({"validation_results": validation_results})
if __name__ == '__main__':
    app.run(debug=True)