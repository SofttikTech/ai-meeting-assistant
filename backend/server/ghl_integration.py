import requests
import logging


def send_data_to_n8n_and_log(data: dict) -> (str):
    n8n_url = "https://epiphany.app.n8n.cloud/webhook/a611f9e2-ed7d-45ed-905c-69b297834579"
    
    try:
        response = requests.post(n8n_url, json=data)
        
        if response.status_code != 200:
            error_message = f"Failed to send data to n8n: {response.text}"
            logging.error(error_message)
            return False, error_message
        
        logging.info("Data sent to n8n successfully.")
        
        return "Data sent and logged successfully."
    
    except Exception as e:
        error_message = f"Error calling n8n endpoint: {str(e)}"
        logging.error(error_message)
        return False, error_message
