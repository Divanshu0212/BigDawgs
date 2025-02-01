from flask import Flask, request, jsonify
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests  # For RAWG API calls
from flask_cors import CORS  # Import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
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
db = firestore.client()

app = Flask(__name__)
CORS(app)

# Load game dataset (Ensure you have a CSV with game details)
games_df = pd.read_csv("./games_dataset.csv")  

# Preprocess game descriptions using TF-IDF
vectorizer = TfidfVectorizer(stop_words="english")
game_vectors = vectorizer.fit_transform(games_df["description"])

# RAWG API Key (Replace with your own)
RAWG_API_KEY = os.getenv('RAWG_API_KEY')
RAWG_API_URL = "https://api.rawg.io/api/games"

def fetch_similar_game_from_rawg(game_name):
    """Search for a game on RAWG and return the first match."""
    params = {"key": RAWG_API_KEY, "search": game_name, "page_size": 1}
    response = requests.get(RAWG_API_URL, params=params)

    if response.status_code == 200:
        results = response.json().get("results", [])
        if results:
            return {
                "name": results[0]["name"],
                "image": results[0].get("background_image", ""),
                "rating": results[0].get("rating", 0),
                "genres": [genre["name"] for genre in results[0].get("genres", [])]
            }
    return None  # No match found

def recommend_games(user_search_history):
    """Find similar games from the dataset and fetch additional similar games from RAWG."""
    if not user_search_history:
        return []

    # Convert search history into a query vector
    user_query = " ".join(user_search_history)
    user_vector = vectorizer.transform([user_query])

    # Compute similarity scores
    similarities = cosine_similarity(user_vector, game_vectors).flatten()
    
    # Get top 10 recommended game indices
    recommended_indices = similarities.argsort()[-10:][::-1]
    
    # Get the recommended games
    recommended_games = games_df.iloc[recommended_indices][["name", "genre"]].to_dict(orient="records")

    # Fetch similar games from RAWG
    rawg_recommendations = []
    for game in recommended_games:
        rawg_game = fetch_similar_game_from_rawg(game["name"])
        if rawg_game:
            rawg_recommendations.append(rawg_game)

    return rawg_recommendations

@app.route("/recommend", methods=["POST"])
def recommend():
    """Fetch user search history from Firebase, find similar games, and recommend from RAWG."""
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    # Fetch user search history from Firebase
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    user_data = user_doc.to_dict()
    user_search_history = user_data.get("searchHistory", [])

    if not user_search_history:
        return jsonify({"error": "No search history found"}), 404

    recommendations = recommend_games(user_search_history)
    print(recommendations)
    return jsonify(recommendations)

if __name__ == "__main__":
    app.run(debug=True)
