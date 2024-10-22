from pyspark.sql import SparkSession
import great_expectations as ge

# Initialize a Spark session
spark = SparkSession.builder \
    .appName("Great Expectations with Spark") \
    .getOrCreate()



# Convert the list to a PySpark DataFrame
df = spark.read.csv(f"/Users/nithin/Documents/React projects/new1/DQ/files/toughestsport 1.csv", header=True, inferSchema=True)


# Convert Spark DataFrame into a Great Expectations SparkDFDataset
ge_df = ge.dataset.SparkDFDataset(df)

# 1. Expect that the 'age' column doesn't contain null values
age_expectation = ge_df.expect_column_values_to_not_be_null("Power")

# 2. You can add more expectations like this:


# Collect all validation results
validation_results = [
    age_expectation,

]

# Print the validation results
for idx, result in enumerate(validation_results, 1):
    print(f"Validation {idx} - Success: {result['success']}")
    print(f"Details: {result}\n")

# Stop the Spark session
spark.stop()