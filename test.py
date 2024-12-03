import pandas as pd
import random

# Generate data
data = {
    "ID": range(1, 101),
    "Name": [f"Person_{i}" for i in range(1, 101)],
    "Age": [random.randint(18, 60) for _ in range(100)],
    "City": [random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]) for _ in range(100)],
    "Salary": [random.randint(30000, 100000) for _ in range(100)],
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv("sample_dataset.csv", index=False)

print("Dataset created and saved to 'sample_dataset.csv'")
