"""
Enhanced Flask API with Theme Support
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from services.story_manager import StoryManager
from scraper.reddit_scraper import RedditScraper
from pathlib import Path
import os

app = Flask(__name__)
CORS(app)
DATA_DIR = Path("data")

@app.route("/init", methods=["POST"])
def init_scraper():
    """Initialize or update theme database"""
    try:
        scraper = RedditScraper()
        scraper.scrape()
        return jsonify({
            "success": True,
            "message": f"Collected {len(scraper.theme_keywords['positive'])} positive and {len(scraper.theme_keywords['negative'])} negative themes"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/study-session", methods=["POST"])
def study_session():
    """Handle study session logging"""
    try:
        data = request.json
        user_id = data.get("user_id", "default")
        planned = data.get("planned_duration", 30)
        actual = data.get("actual_duration", 30)
        success = actual >= planned

        manager = StoryManager(user_id)
        segment = manager.generate_segment(success, actual)
        return jsonify({
            "success": True,
            "segment": segment,
            "state": manager.get_current_state()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    app.run(debug=True)