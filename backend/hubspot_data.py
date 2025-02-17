import os
import logging
import hubspot
from hubspot.crm.contacts.exceptions import ApiException
from hubspot.crm.contacts import PublicObjectSearchRequest

logging.basicConfig(level=logging.DEBUG)

hubspot_client = hubspot.Client.create(access_token="pat-na2-11ae55e2-1abc-4a19-9d22-fe363af8d9c5")

def get_contact_by_email(email):
    try:
        search_request = PublicObjectSearchRequest(
            filter_groups=[{
                "filters": [{
                    "propertyName": "email",
                    "operator": "EQ",
                    "value": email
                }]
            }]
        )
        response = hubspot_client.crm.contacts.search_api.do_search(public_object_search_request=search_request)
        
        if response.results and len(response.results) > 0:
            return response.results[0].to_dict()
        else:
            return None
    except ApiException as e:
        logging.error(f"Error fetching contact: {e}")
        return None

def main():
    test_email = input("Enter contact email: ").strip()
    
    if not test_email:
        print("Email cannot be empty!")
        return
    
    contact = get_contact_by_email(test_email)
    
    if contact:
        print("Contact Details:")
        print(contact)
    else:
        print("Contact not found.")

if __name__ == "__main__":
    main()
