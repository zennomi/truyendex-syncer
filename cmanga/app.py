from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from werkzeug.exceptions import HTTPException
import logging

app = Flask(__name__)

# Load the pre-trained multilingual model
model = SentenceTransformer('distiluse-base-multilingual-cased')

# Configure logging
logging.basicConfig(
    level=logging.ERROR,  # Log only errors
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app_errors.log"),  # Log to a file
        logging.StreamHandler()                # Log to the console
    ]
)

@app.route('/embed', methods=['POST'])
def embed():
    try:
        # Get the JSON data sent in the request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        # Check if 'sentences' key exists and is a list
        sentences = data.get('sentences')
        if not isinstance(sentences, list) or not all(isinstance(s, str) for s in sentences):
            return jsonify({"error": "'sentences' must be a list of strings"}), 400
        
        # Generate embeddings for the sentences
        embeddings = model.encode(sentences)

        # Return the embeddings as JSON response
        return jsonify({"embeddings": embeddings.tolist()})
    
    except HTTPException as http_ex:
        # Handle HTTP-specific errors
        app.logger.error(f"HTTP error: {str(http_ex)}")
        return jsonify({"error": str(http_ex)}), http_ex.code
    except Exception as ex:
        # Handle generic errors
        app.logger.error(f"Unexpected error: {str(ex)}")
        return jsonify({"error": f"An unexpected error occurred: {str(ex)}"}), 500

if __name__ == '__main__':
    # Run the app with debug mode off
    app.run(debug=False, host='0.0.0.0', port=5000)
