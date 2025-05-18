# filepath: c:\Users\nikag\ICS\Hackathon\realDeal\Backend\test_api.py
import requests

BASE_URL = "http://localhost:5000"

def test_init():
    try:
        print("Sending request to /init...")
        response = requests.post(f"{BASE_URL}/init")
        print("Init endpoint response:", response.json())
    except Exception as e:
        print("Error during /init:", e)

def test_study_session():
    payload = {
        "user_id": "test_user",
        "planned_duration": 30,
        "actual_duration": 35
    }
    try:
        print("Sending request to /study-session...")
        response = requests.post(f"{BASE_URL}/study-session", json=payload)
        print("Study session endpoint response:", response.json())
    except Exception as e:
        print("Error during /study-session:", e)

if __name__ == "__main__":
    test_init()
    test_study_session()