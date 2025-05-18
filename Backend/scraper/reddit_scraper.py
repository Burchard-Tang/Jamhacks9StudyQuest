"""
Enhanced Reddit Scraper with AI-Powered Sentiment Analysis
- Uses Ollama to classify post sentiment
- Extracts thematic keywords for story generation
- Organizes content by university and sentiment
"""

import praw
import json
import ollama
from dotenv import load_dotenv
import os
from collections import defaultdict

load_dotenv()

class RedditScraper:
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent="UniStoryScraper/2.0"
        )
        self.subreddits = ["uwaterloo", "UofT", "mcgill", "UBC", "queensuniversity"]
        self.theme_keywords = {
            "positive": defaultdict(list),
            "negative": defaultdict(list)
        }

    def _analyze_sentiment(self, text):
        """Use AI to classify post sentiment and extract themes"""
        prompt = f"""Analyze this university-related post:
        
        {text[:1000]}  # Truncate to avoid context overload
        
        Respond with JSON format:
        {{
            "sentiment": "positive" or "negative",
            "keywords": ["list", "of", "theme", "words"],
            "reason": "brief explanation"
        }}"""
        
        try:
            response = ollama.generate(
                model="llama3",
                prompt=prompt,
                format="json",
                options={"temperature": 0.2}
            )
            return json.loads(response["response"])
        except:
            return {"sentiment": "neutral", "keywords": [], "reason": "Analysis failed"}

    def _extract_themes(self, text, sentiment):
        """Get thematic keywords from text based on sentiment"""
        prompt = f"""Extract 3-5 thematic keywords from this {sentiment} university post:
        
        {text[:1000]}
        
        Respond as a JSON list: ["keyword1", "keyword2"]"""
        
        try:
            response = ollama.generate(
                model="llama3",
                prompt=prompt,
                format="json"
            )
            return json.loads(response["response"])
        except:
            return []

    def scrape(self, limit=25):
        """Main scraping function with AI analysis"""
        results = {sub: {"positive": [], "negative": []} for sub in self.subreddits}
        
        for sub in self.subreddits:
            print(f"Scraping r/{sub}...")
            try:
                for post in self.reddit.subreddit(sub).hot(limit=limit):
                    # Analyze with AI
                    analysis = self._analyze_sentiment(post.title + " " + post.selftext)
                    
                    if analysis["sentiment"] in ("positive", "negative"):
                        # Extract thematic keywords
                        themes = self._extract_themes(post.title + " " + post.selftext, analysis["sentiment"])
                        
                        # Store results
                        entry = {
                            "text": post.title,
                            "content": post.selftext,
                            "url": post.url,
                            "keywords": themes,
                            "score": post.score,
                            "analysis": analysis["reason"]
                        }
                        results[sub][analysis["sentiment"]].append(entry)
                        
                        # Aggregate keywords for story generation
                        for keyword in themes:
                            self.theme_keywords[analysis["sentiment"]][sub].append(keyword.lower())
            except Exception as e:
                print(f"Error scraping r/{sub}: {str(e)}")
        
        # Save both raw data and theme dictionary
        os.makedirs("data", exist_ok=True)
        with open("data/university_posts.json", "w") as f:
            json.dump(results, f, indent=2)
        with open("data/theme_keywords.json", "w") as f:
            # Convert nested defaultdicts to dicts
            serializable = {
                sentiment: dict(subs)
                for sentiment, subs in self.theme_keywords.items()
            }
            json.dump(serializable, f, indent=2)
        
        return results

if __name__ == "__main__":
    scraper = RedditScraper()
    scraper.scrape()