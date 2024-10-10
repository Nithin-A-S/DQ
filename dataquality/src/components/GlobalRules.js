import React from 'react';
import './style/GRstyle.css';
const expectationsList = [
    { name: 'expect_column_values_to_be_unique', description: 'Ensure all column values are unique.' },
    { name: 'expect_column_values_to_not_be_null', description: 'Ensure column values are not null.' },
    { name: 'expect_column_values_to_match_regex', description: 'Ensure column values match a specific regex pattern.', input: 'Regex pattern' },
    { name: 'expect_column_mean_to_be_between', description: 'Ensure column mean is between a specified range.', input: 'Min, Max' },
    { name: 'expect_column_median_to_be_between', description: 'Ensure column median is between a specified range.', input: 'Min, Max' },
    { name: 'expect_column_values_to_be_of_type', description: 'Ensure column values are of a specific data type.', input: 'Data type' },
    { name: 'expect_column_value_lengths_to_be_between', description: 'Ensure column value lengths are between a minimum and maximum length.', input: 'Min length, Max length' },
    { name: 'expect_column_values_to_match_strftime_format', description: 'Ensure column values match a specified datetime format.', input: 'Datetime format' },
    { name: 'expect_column_values_to_be_in_set', description: 'Ensure column values are within a specified set of values.', input: 'Set of values' },
    { name: 'expect_column_values_to_be_between', description: 'Ensure column values are within a specified numeric range.', input: 'Min, Max' },
    { name: 'expect_column_quantile_values_to_be_between', description: 'Ensure column quantile values are between a specified range.', input: 'Quantile, Min, Max' },
    { name: 'expect_column_to_exist', description: 'Ensure that a specified column exists in the dataset.' },
    { name: 'expect_column_values_to_be_increasing', description: 'Ensure that column values are monotonically increasing.' },
    { name: 'expect_column_values_to_be_decreasing', description: 'Ensure that column values are monotonically decreasing.' },
    { name: 'expect_column_max_to_be_between', description: 'Ensure the maximum value in the column is within a specified range.', input: 'Min, Max' },
    { name: 'expect_column_min_to_be_between', description: 'Ensure the minimum value in the column is within a specified range.', input: 'Min, Max' },
    { name: 'expect_column_proportion_of_unique_values_to_be_between', description: 'Ensure the proportion of unique values in the column is within a specified range.', input: 'Min proportion, Max proportion' },
    { name: 'expect_column_stdev_to_be_between', description: 'Ensure the standard deviation of the column is within a specified range.', input: 'Min, Max' },
    { name: 'expect_column_kl_divergence_to_be_less_than', description: 'Ensure the KL divergence of the column relative to another distribution is below a specified threshold.', input: 'Max KL divergence' },
    { name: 'expect_column_chisquare_p_value_to_be_greater_than', description: 'Ensure the p-value of the chi-square test on column values is greater than a specified threshold.', input: 'Min p-value' }
  ];

const GlobalRules = () => {
  return (
    <div className="global-rules-container">
      <h2>Global Rules</h2>
      <p>Here you can define and manage global rules for data quality validation.</p>
      <ul className="expectations-list">
        {expectationsList.map((rule, index) => (
          <li key={index} className="expectation-item">
            <strong>{rule.name}</strong>: {rule.description}
            {rule.input && <p>Input: {rule.input}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GlobalRules;