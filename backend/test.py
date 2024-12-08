from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import gridfs
import pandas as pd
from io import BytesIO
from pyspark.sql import SparkSession 



app = Flask(__name__)
CORS(app)


spark = SparkSession.builder \
    .appName("DataQualityApp") \
    .getOrCreate()
    
    
# MongoDB Configuration
con_string = "mongodb+srv://datamaccount:dataacc1234@clustermaccel.n4dwyfo.mongodb.net/?retryWrites=true&w=majority&appName=clustermaccel"
client = MongoClient(con_string)
database = client.get_database("csvfolder")
tasks_collection = database.get_collection("DQ-datasets")
users_collection = database.get_collection("DQ-users")

@app.route('/get-user-data', methods=['POST'])
def get_user_data():
    try:
        # # # Fetch all documents from the collection
        # all_documents = tasks_collection.find()

        # # # Iterate through the documents
        # for doc in all_documents:
        #     print(doc)
        # # Extract username from the request body
        req_data = request.json
        print(req_data)
        username = req_data.get('username')
        print(username)
        if not username:
            return jsonify({"error": "Username is required"}), 400

        # Query the MongoDB collection to find the document for the user
        # user_data = tasks_collection.find_one({"username": username})
        user_data = tasks_collection.find_one(
            {"username": username},  # Query filter
            {"username": 1, "csvfiles": 1, "_id": 0}  # Projection: include only specific fields
        )

        print(user_data)
        if not user_data:
            return jsonify({"error": "User not found"}), 404

        # Return the user's data as JSON
        return jsonify({
            "username": user_data["username"],
            "csvfiles": user_data["csvfiles"]
            # "data": user_data["data"]
        }), 200
        return "SUCCESS",200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
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
    return jsonify({"schema": schema, "table": current_table})
    
if __name__ == '__main__':
    app.run(debug=True)
