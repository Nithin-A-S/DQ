from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import gridfs
import pandas as pd
from io import BytesIO

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
con_string = "mongodb+srv://datamaccount:dataacc1234@clustermaccel.n4dwyfo.mongodb.net/?retryWrites=true&w=majority&appName=clustermaccel"
client = MongoClient(con_string)
database = client.get_database("csvfolder")
tasks_collection = database.get_collection("DQ-datasets")
users_collection = database.get_collection("DQ-users")
username = "newuser1@gmail.com"
user_data = tasks_collection.find_one({"username": username})
print(user_data)