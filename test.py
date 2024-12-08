import pandas as pd
from great_expectations.dataset import PandasDataset

# Create a sample dataset
data = {
    "age": [23, 34, 45, 27, 29],
    "name": ["Alice", "Bob", "Charlie", "Diana", "Evan"]
}
df = pd.DataFrame(data)

# Load the dataframe into a Great Expectations dataset
ge_dataset = PandasDataset(df)

# Add an expectation for the column 'age' to be of type 'integer'
ge_dataset.expect_column_values_to_be_of_type("age", "int")

# Validate the expectations and print the result
results = ge_dataset.validate()
print(results)
