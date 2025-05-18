"""
Enhanced Reddit Scraper with AI-Powered Sentiment Analysis
- Uses Ollama to classify post sentiment
- Extracts thematic keywords for story generation
- Organizes content by university and sentiment
"""

import praw
import json
from dotenv import load_dotenv
import os
from collections import defaultdict

load_dotenv()

import ollama

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
        prompt = f"""Analyze this university-related post,:
        
        {text[:1000]}
        
        Extract the sentiment and the keywords that are the main reason for that sentiment.
        Respond with JSON format:
        {{
            "sentiment": "positive" or "negative",
            "keywords": ["list", "of", "theme", "words"],
            "reason": "brief explanation"
        }}"""
        
        try:
            response = ollama.generate(
                model="llama2",
                prompt=prompt,
                format="json",
                options={"temperature": 0.2}
            )
            return json.loads(response["response"])
        except Exception as e:
            print(f"[ERROR] ollama.generate sentiment failed: {e}")
            return {"sentiment": "neutral", "keywords": [], "reason": "Analysis failed"}

    def _extract_themes(self, text, sentiment):
        """Get thematic keywords from text based on sentiment"""
        prompt = f"""Extract 3-5 thematic keywords from this {sentiment} university post:
        
        {text[:1000]}
        
        Respond as a JSON list: ["keyword1", "keyword2"]"""
        
        try:
            response = ollama.generate(
                model="llama2",
                prompt=prompt,
                format="json"
            )
            return json.loads(response["response"])
        except Exception as e:
            print(f"[ERROR] ollama.generate theme failed: {e}")
            return []

    def scrape(self, limit=50):
        """Main scraping function with AI analysis"""
        results = {sub: {"positive": [], "negative": []} for sub in self.subreddits}
        
        limit = int(1)
        for sub in self.subreddits:
            print(f"Scraping r/{sub}...")
            try:
                for post in self.reddit.subreddit(sub).hot(limit=limit):
                    # Analyze with AI
                    analysis = self._analyze_sentiment(post.title + " " + post.selftext)
                   
                    if analysis["sentiment"] in ["positive", "negative"]:
                        # Aggregate keywords for story generation
                        keywords = []
                        for keyword in analysis["keywords"]:
                            keywords.append(keyword.lower())

                        self.theme_keywords[analysis["sentiment"]][sub] = keywords
                        # Store results
                        entry = {
                            "text": post.title,
                            "content": post.selftext,
                            "url": post.url,
                            "score": post.score,
                            "sentiment": analysis["sentiment"],
                            "keywords": keywords,
                            "reason": analysis["reason"],
                        }
                        results[sub][analysis["sentiment"]].append(entry)
                    else:
                        print(f"Post skipped due to neutral sentiment: {post.title}")
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
        
        # User finishes the study session
        # you want to generate a story based on the keywords and on user's previous storyline
        # User's session was successful, use positive keywords
        # user's session was not successful, use negative keywords
        # User has a university, and for each university, you have a list of relevant subreddits
        return results

if __name__ == "__main__":
    scraper = RedditScraper()
    scraper.scrape()