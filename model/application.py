from flask import Flask, request, jsonify
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
from flask_cors import CORS
import os
from dotenv import load_dotenv
from functools import lru_cache
from typing import List, Dict, Optional
import logging
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class GameRecommender:
    def __init__(self):
        self.initialize_firebase()
        self.initialize_flask()
        self.load_game_data()
        self.executor = ThreadPoolExecutor(max_workers=3)  # For parallel API calls
        
    def initialize_firebase(self):
        """Initialize Firebase connection with error handling."""
        try:
            cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCyRZaP9WYDePnv\nk41Qpyrut0q+Uc4PaML1EVBW5zjOG3PkB2f1Kst7/nyyEFoG6IPJWZuFYSUG9jRB\n69t9E3Qa8i9aN1fX6NgepspDeVmcZAUzwCDjpGYGi5ra0X5mqGaXQWKFgVGESYdX\nJLazlWyZz32yGARPtKoRAc+7S+r6SRTzLjWE+D535SHhOeTtTKWkO1xLdkrGTP7Y\nqeHxAYnNoJHHfhIcrFEMzHay2vLLMStz1we7H+XvemCOBj1eECRZq0hPng8Ke/cJ\nJUTXsyERfjeEYvafT0iZscLj6AIUYvZCvjbTJAKAOT29tviPJSW6rF50TSAMfsR4\ndf2YFyyXAgMBAAECggEANGP3B3+a51JaQWofkaBPIbCEKsJnyGeFQ/g+oAt7yjaP\nLGhwyMA25M25X6smifkzIa1P4zbVZuJcITNrYaqh6HlcKSsyiaVIPlnN/15eU3Oh\ng7/m6n+Z7DqC2+PNPeYnoDP6/Dkw96uUNqv3dXdoXxt3WSttuO7jO/RIVEbPW5Y3\nzI1fL5A10fVNu3N0Xjy2ZaRCTuqXC5MPRxqiW4g3bqQwsDNDDbEohgjk+ZWiyG0f\n/+aZCAWARUgHTV2KhIV8e8Zo1O4YYtF9q47WrkzlAJUOO7z2IRrH/V+MsJtE2OrP\n1OL5Sw+0jwelsYl4f9UcqktyGFS0KNme6TOgQ/CrwQKBgQD239QX7UX0yQPxMlLz\nqGgtH/qCKNK1D7Aujfu5C9fzUkUYSAIROazZwVGNBZU+lzMIyXPp63vnj/2xD9Vt\neuEDj/77YPVzsyeriK4cxZmaN+I5Ykoplwh6QYUORhspZPxPOa7Kh2OwAMLCiN95\ncZ7AaoElmcm6uecHpNM4jQLhuQKBgQC43JMCCh7InhcosrbhuMhWPuNU6Mf6b7Z0\nmkyhtyN8w53WDo7Vpiv9mxsQxmK6cwzbaGzjBsti+0NPdFfx1XeHRwC40Tff98NN\nMHEsCwi8NdO6SAQKd1SrChQCL2z3d2uj5wyTgZiqIl1FOdnBc15asAcdy2Bnv2b8\niWF1/UvozwKBgGwfZcXA7pWiAG7/ymLazB2PVujwtjAEmfYZyzilXkQ8MPTMfNNM\nfk60o2HvIwlRsVFU4cZ+kzq8zrBgreoQGkK0K0mvknDE80fmSdNiG772YMcfLDoA\n4v6geYTh4X2EtBiCu/IJz/hCrQoEZlPLFmtRehScwURdrTik0LmA0NVJAoGARImz\nD2yFIUhLudEYsPN7g05ppo9vpVBJy01x3/swcw9rs3NOTbQAV1RsYnnLHOmO+MHs\nrPdV7OrPd+Pgv06vtD4E7IDVQHpxtGqjavrkUDN8vnH43ZCEma1w4aaHtfBWvjvp\nk77WxS1ce1AJhgmqD+F3ofpHUe/K1RJySfaRcE0CgYBjj4S6COZjTy974wc9f3AC\npAHXZw6Ox0L+ksYx9fqIsCpXBQeEH7Os6okYm54Qpxwi/qhRMw8bjf3Q3w6CCk6V\nDZJV4GcX5pZHiB1oQnT1blsk3lfXFal84PKzXGHsqlP2aGu+wEiWatfTwG+Dqgss\nFxTb8fx/InnIPjWMU3qHlw==\n-----END PRIVATE KEY-----\n",
    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_CERT_URL')
})
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            raise

    def initialize_flask(self):
        """Initialize Flask application with CORS."""
        self.app = Flask(__name__)
        CORS(self.app)
        self.setup_routes()

    def load_game_data(self):
        """Load and preprocess game dataset with error handling."""
        try:
            self.games_df = pd.read_csv("./games_dataset.csv")
            self.vectorizer = TfidfVectorizer(stop_words="english")
            self.game_vectors = self.vectorizer.fit_transform(self.games_df["description"])
        except Exception as e:
            logger.error(f"Failed to load game data: {e}")
            raise

    def setup_routes(self):
        """Set up Flask routes."""
        self.app.route("/recommend", methods=["POST"])(self.recommend_endpoint)

    @lru_cache(maxsize=100)
    def fetch_similar_game_from_rawg(self, game_name: str) -> Optional[Dict]:
        """Cached function to fetch game data from RAWG API."""
        try:
            params = {
                "key": os.getenv('VITE_RAWG_API_KEY'),
                "search": game_name,
                "page_size": 1
            }
            response = requests.get(
                "https://api.rawg.io/api/games",
                params=params,
                timeout=5  # Add timeout
            )
            response.raise_for_status()
            
            results = response.json().get("results", [])
            if results:
                return {
                    "name": results[0]["name"],
                    "image": results[0].get("background_image", ""),
                    "rating": results[0].get("rating", 0),
                    "genres": [genre["name"] for genre in results[0].get("genres", [])]
                }
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"RAWG API request failed for {game_name}: {e}")
            return None

    def get_user_history(self, user_id: str) -> Optional[List[str]]:
        """Fetch and combine user search and click history."""
        try:
            user_doc = self.db.collection("users").document(user_id).get()
            if not user_doc.exists:
                return None
                
            user_data = user_doc.to_dict()
            search_history = set(user_data.get("searchHistory", []))
            click_history = set(user_data.get("clickHistory", []))
            return list(search_history | click_history)  # Union of both sets
        except Exception as e:
            logger.error(f"Failed to fetch user history: {e}")
            return None

    def recommend_games(self, user_history: List[str]) -> List[Dict]:
        """Generate game recommendations using parallel processing."""
        if not user_history:
            return []

        # Convert search history into a query vector
        user_vector = self.vectorizer.transform([" ".join(user_history)])
        similarities = cosine_similarity(user_vector, self.game_vectors).flatten()
        
        # Get top 10 recommended games
        recommended_indices = similarities.argsort()[-10:][::-1]
        recommended_games = self.games_df.iloc[recommended_indices][["name", "genre"]].to_dict(orient="records")

        # Fetch RAWG data in parallel
        futures = [
            self.executor.submit(self.fetch_similar_game_from_rawg, game["name"])
            for game in recommended_games
        ]
        
        # Collect results, filtering out None values
        return [result.result() for result in futures if result.result() is not None]

    def recommend_endpoint(self):
        """Handle recommendation requests."""
        try:
            user_id = request.json.get("user_id")
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400

            user_history = self.get_user_history(user_id)
            if not user_history:
                return jsonify({"error": "No user history found"}), 404

            recommendations = self.recommend_games(user_history)
            return jsonify(recommendations)
        except Exception as e:
            logger.error(f"Recommendation endpoint error: {e}")
            return jsonify({"error": "Internal server error"}), 500

    def run(self, debug=False):
        """Run the Flask application."""
        self.app.run(debug=debug)

if __name__ == "__main__":
    recommender = GameRecommender()
    recommender.run(debug=True)