

def calculate_score(validation_data):
    try:
        validation_results = validation_data.get("validation_results", [])
        if not validation_results:
            return 0.0

       
        unexpected_percentages = [
            result["result"].get("unexpected_percent", 0)
            for result in validation_results
            if "result" in result
        ]
        
        if not unexpected_percentages:
            return 0.0 

        average = sum(unexpected_percentages) / len(unexpected_percentages)
        return average
    except Exception as e:
        print(f"Error calculating score: {e}")
        return 0.0  


example_json = {
    "validation_results": [
        {
            "result": {
                "unexpected_percent": 100.0
            }
        },
        {
            "result": {
                "unexpected_percent": 50.0
            }
        },
        {
            "result": {
                "unexpected_percent": 0.0
            }
        }
    ]
}

average_score = calculate_score(example_json)
print(f" {average_score}%")

def check_source(flag):
    if not flag:  
        source = 'Azure'
    elif flag == 'upload': 
        source = 'uploaded data'
    else:
        source = ''  \

    return source
