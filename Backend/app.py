from flask import Flask, request, jsonify
from textblob import TextBlob
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import datetime  # Added for timestamp support

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
db = client["sentiment_db"]
collection = db["tweets"]

# Verify MongoDB connection
try:
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    # Create collection if not exists and create index
    if "tweets" not in db.list_collection_names():
        db.create_collection("tweets")
    collection.create_index([("timestamp", -1)])  # Index for sorting
except Exception as e:
    print("❌ MongoDB connection failed:", e)

@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        text = request.json.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text field is required"}), 400
            
        analysis = TextBlob(text)
        polarity = float(analysis.sentiment.polarity)
        sentiment = "positive" if polarity > 0 else "negative" if polarity < 0 else "neutral"
        
        # Store in MongoDB with timestamp
        document = {
            "text": text,
            "sentiment": sentiment,
            "polarity": polarity,
            "timestamp": datetime.datetime.utcnow()
        }
        result = collection.insert_one(document)
        
        # Return the complete analysis data (excluding _id)
        return jsonify({
            "data": {
                "text": text,
                "sentiment": sentiment,
                "polarity": polarity,
                "timestamp": document["timestamp"].isoformat()
            },
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def get_history():
    try:
        # Get history sorted by newest first
        history = list(collection.find({}, {"_id": 0})
                      .sort("timestamp", -1)  # Newest first
                      .limit(10))
        return jsonify({
            "data": history,
            "count": len(history),
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)