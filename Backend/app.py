from flask import Flask, request, jsonify
from textblob import TextBlob
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app with CORS
app = Flask(__name__)
CORS(app, resources={
    r"/analyze": {"origins": "*"},
    r"/history": {"origins": "*"}
})  # Allow all origins for these routes

# MongoDB connection setup
uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
client = MongoClient(uri, server_api=ServerApi('1'))

# Verify MongoDB connection
try:
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print("❌ MongoDB connection failed:", e)

db = client["sentiment_db"]
collection = db["tweets"]

@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        text = request.json.get("text", "")
        if not text:
            return jsonify({"error": "Text field is required"}), 400
            
        analysis = TextBlob(text)
        polarity = analysis.sentiment.polarity
        sentiment = "positive" if polarity > 0 else "negative" if polarity < 0 else "neutral"
        
        # Store in MongoDB
        collection.insert_one({
            "text": text,
            "sentiment": sentiment,
            "polarity": float(polarity)
        })
        
        return jsonify({
            "sentiment": sentiment,
            "polarity": polarity,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def get_history():
    try:
        history = list(collection.find({}, {"_id": 0}).limit(10))
        return jsonify({
            "data": history,
            "count": len(history),
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)