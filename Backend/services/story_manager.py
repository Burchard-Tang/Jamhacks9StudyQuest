"""
Complete Story Manager with AI-Powered Story Generation
- Handles both positive and negative story arcs
- Maintains persistent user progress
- Uses thematic keywords from Reddit scraping
"""

import ollama
import json
import random
import os
from datetime import datetime
from pathlib import Path

class StoryManager:
    def __init__(self, user_id, university=None):
        self.user_id = user_id
        self.data_dir = Path("data")
        self.story_file = self.data_dir / f"user_stories/{user_id}.json"
        self.themes_file = self.data_dir / "theme_keywords.json"
        self.university = university  # <-- store university

        # Initialize directories
        os.makedirs(self.data_dir / "user_stories", exist_ok=True)

        # Load or initialize data
        self.story = self._load_story(self.university)
        self.themes = self._load_themes()

    def _load_story(self, university=None):
        """Load or initialize user story"""
        try:
            with open(self.story_file, "r") as f:
                story = json.load(f)
                # Validate story structure
                if not all(k in story for k in ["university", "story_arc", "stats"]):
                    raise ValueError("Invalid story format")
                # If university is provided and different, update it
                if university and story.get("university") != university:
                    story["university"] = university
                    with open(self.story_file, "w") as wf:
                        json.dump(story, wf, indent=2)
                return story
        except (FileNotFoundError, json.JSONDecodeError, ValueError):
            # Initialize new story with user's university if provided, else random
            themes = self._load_themes()
            if university and university in (themes.get("positive", {}) or {}):
                default_uni = university
            else:
                default_uni = random.choice(list(themes.get("positive", {}).keys()) or ["uwaterloo"])
            return {
                "university": default_uni,
                "story_arc": ["You've just arrived at university. Your journey begins..."],
                "stats": {
                    "streak": 0,
                    "gpa": 4.0,
                    "term": 1,
                    "failed_sessions": 0
                },
                "created_at": datetime.now().isoformat()
            }

    def _load_themes(self):
        """Load thematic keywords"""
        try:
            with open(self.themes_file, "r") as f:
                themes = json.load(f)
                # Validate theme structure
                if not all(k in themes for k in ["positive", "negative"]):
                    raise ValueError("Invalid themes format")
                return themes
        except (FileNotFoundError, json.JSONDecodeError, ValueError):
            return {"positive": {}, "negative": {}}

    def _save_story(self):
        """Persist story to file"""
        self.story["last_updated"] = datetime.now().isoformat()
        with open(self.story_file, "w") as f:
            json.dump(self.story, f, indent=2)

    def _get_keywords(self, sentiment):
        """Get 3 random thematic keywords for current university"""
        uni = self.story["university"]
        available = self.themes[sentiment].get(uni, [])
        return random.sample(available, min(3, len(available))) if available else []

    def generate_segment(self, success, duration):
        """Generate new story segment with AI"""
        sentiment = "positive" if success else "negative"
        keywords = self._get_keywords(sentiment)
        
        prompt = f"""Generate a university life story segment where the student {'succeeds' if success else 'fails'}:
        
        University: {self.story['university']}
        Context: {self.story['story_arc'][-1][:500]}
        Duration: {duration} minutes
        GPA: {self.story['stats']['gpa']:.1f}
        Keywords: {", ".join(keywords)}
        
        Make it {"inspiring" if success else "humorously painful"} and include:
        - At least 2 keywords naturally in context
        - Academic consequences
        - Social interactions"""

        try:
            response = ollama.generate(
                model="llama2",
                prompt=prompt,
                options={"temperature": 0.7}
            )
            new_segment = response["response"]
        except Exception as e:
            new_segment = f"Session update: {'Completed' if success else 'Failed'} study session."

        self._update_stats(success)
        self.story["story_arc"].append(new_segment)
        self._save_story()
        return new_segment

    def _update_stats(self, success):
        """Update user statistics"""
        if success:
            self.story["stats"]["streak"] += 1
            self.story["stats"]["gpa"] = min(4.0, self.story["stats"]["gpa"] + 0.1)
        else:
            self.story["stats"]["streak"] = 0
            self.story["stats"]["failed_sessions"] += 1
            self.story["stats"]["gpa"] = max(0.0, self.story["stats"]["gpa"] - 0.3)

    def get_current_state(self):
        """Return current story state for API response"""
        return {
            "university": self.story["university"],
            "current_segment": self.story["story_arc"][-1],
            "stats": self.story["stats"],
            "streak_status": "🔥" * min(3, self.story["stats"]["streak"])
        }