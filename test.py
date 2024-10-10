import pandas as pd
import great_expectations as ge

# Sample dataframe for testing
data = {
    'numeric_column': [1, 2, 3, 4, 5],
    'text_column': ['abc', 'def', 'ghi', 'jkl', 'mno'],
    'date_column': ['2020-01-01', '2020-02-01', '2020-03-01', '2020-04-01', '2020-05-01'],
    'json_column': ['{"name": "John"}', '{"name": "Jane"}', '{"name": "Doe"}', '{"name": "Smith"}', '{"name": "Anna"}'],
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

# Convert to Great Expectations dataset
df = ge.from_pandas(pd.DataFrame(data))

# Sample parameters for each expectation
params = {
    'regex_pattern': r'^[a-z]+$',  # For matching regex
    'min_value': 2,  # Min value for ranges
    'max_value': 4,  # Max value for ranges
    'type_list': ['int', 'float'],  # Expected types
    'json_schema': {"type": "object", "properties": {"name": {"type": "string"}}},  # JSON schema
    'target_value': 10,  # Target value for multicolumn sum
    'row_count': 5,  # Expected row count
    'column_list': ['numeric_column', 'text_column', 'date_column', 'json_column'],  # Ordered column list
    'strftime_format': '%Y-%m-%d',  # Date format
    'threshold': 1.5,  # Threshold for z-scores
}

# Define columns for multicolumn expectations
cols = ['numeric_column', 'text_column']

# Test each expectation
for expectation, func in expectation_map.items():
    try:
        if 'multicolumn' in expectation:  # Handle multicolumn expectations
            if 'params' in func.__code__.co_varnames:
                result = func(df, cols, params)
            else:
                result = func(df, cols)
        elif 'table' in expectation:  # Handle table expectations
            result = func(df, params)
        else:  # Column-specific expectations
            result = func(df, 'numeric_column', params)
        
        # Print the result
        print(f"{expectation}: {result.success}")
    except Exception as e:
        print(f"{expectation} failed with error: {e}")