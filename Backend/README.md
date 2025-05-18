# University Study Story App

## Setup
1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Set up Reddit API keys in `.env`
3. Initialize stereotypes database:
   ```bash
   python backend/app.py init
   ```
4. Run the app:
   ```bash
   python backend/app.py
   ```

## API Endpoints
- `POST /init`: Initialize stereotype database
- `POST /study-session`: Log a study session
  ```json
  {
    "user_id": "string",
    "planned_duration": 30,
    "actual_duration": 25
  }
  ```