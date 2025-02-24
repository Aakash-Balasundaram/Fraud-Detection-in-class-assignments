import torch
from flask import Flask, request, jsonify, render_template
import json
import logging
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import BertTokenizer, BertForSequenceClassification,AutoTokenizer, AutoModel
from transformers import pipeline
from sklearn.preprocessing import normalize
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch.nn.functional as F


app = Flask(__name__)

# Render HTML Pages
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/cluster/')
def cluster():
    return render_template("cluster.html")

@app.route('/ai_detection/')
def ai_detection():
    return render_template("ai_detection.html")

@app.route('/code_cluster/')
def code_cluster():
    return render_template("code_cluster.html")

# Function to create clusters based on cosine similarity
def create_clusters(texts, threshold=0.6):
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(texts)
        cosine_sim = cosine_similarity(tfidf_matrix)

        clusters = []
        visited = set()
        cluster_similarities = []

        for i in range(len(texts)):
            if i not in visited:
                current_cluster = [i]
                similarities = []

                for j in range(i + 1, len(texts)):
                    if cosine_sim[i][j] >= threshold:
                        current_cluster.append(j)
                        visited.add(j)
                        similarities.append(cosine_sim[i][j])

                avg_similarity = round(np.mean(similarities) * 100, 2) if similarities else 100
                clusters.append(current_cluster)
                cluster_similarities.append(avg_similarity)
                visited.add(i)

        return clusters, cluster_similarities
    except Exception as e:
        logging.error(f"Error in create_clusters: {str(e)}")
        return [], []

@app.route('/compare-texts/', methods=['POST'])
def cluster_files():
    try:
        data = request.get_json()
        files_data = data.get("files", [])
        texts = [file["content"] for file in files_data]
        names = [file["name"] for file in files_data]

        if not texts:
            return jsonify({'error': 'No valid files found'}), 400

        clusters, cluster_similarities = create_clusters(texts, threshold=0.3)

        result = []
        for idx, cluster in enumerate(clusters):
            result.append({
                "cluster_id": idx + 1,
                "names": [names[i] for i in cluster],
                "avg_similarity": cluster_similarities[idx]
            })

        return jsonify(result)
    except Exception as e:
        logging.error(f"Error in cluster_files: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# Load model and tokenizer
model_name = "roberta-base-openai-detector"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
model.eval()  # Set model to evaluation mode

@app.route('/detect_ai_content/', methods=['POST'])
def detect_ai_content():
    """
    API endpoint to detect AI-generated content using the RoBERTa-based model.
    """
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Empty text input"}), 400

        # Tokenize input
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)

        # Get model predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = F.softmax(logits, dim=-1)[0].tolist()  # Convert tensor to list

        ai_probability = round(probabilities[1], 2)  # AI-generated probability
        human_probability = round(probabilities[0], 2)  # Human-written probability

        return jsonify({
            "ai_probability": ai_probability,
            "human_probability": human_probability
        })

    except Exception as e:
        logging.error(f"Error in detect_ai_content_api: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


#---------------------------------------------------------------------------------------------#


# Set logging level
logging.basicConfig(level=logging.INFO)

# Detect device (GPU or CPU)
device = 0 if torch.cuda.is_available() else -1

# Load GraphCodeBERT model and tokenizer
feature_extractor = pipeline(
    "feature-extraction",
    model="microsoft/graphcodebert-base",
    tokenizer="microsoft/graphcodebert-base",
    device=device
)

def extract_embeddings(code_snippets):
    """
    Extract CLS token embeddings using GraphCodeBERT.
    """
    try:
        logging.info(f"Extracting embeddings for {len(code_snippets)} snippets")
        embeddings = feature_extractor(code_snippets, truncation=True, padding=True, max_length=512)

        if not embeddings or len(embeddings) == 0:
            logging.error("No embeddings extracted. Check input data or model loading.")
            return np.array([])

        cls_embeddings = [np.array(embed).squeeze()[0] for embed in embeddings]

        logging.info(f"Extracted {len(cls_embeddings)} embeddings with shape {cls_embeddings[0].shape if cls_embeddings else 'N/A'}")

        return np.array(cls_embeddings)

    except Exception as e:
        logging.error(f"Error extracting embeddings: {str(e)}", exc_info=True)
        return np.array([])


def cluster_code_files(files, threshold=0.8):
    """
    Cluster files using cosine similarity without DBSCAN.
    Groups files where similarity > threshold into the same cluster.
    """
    try:
        if not files or not all(isinstance(f, dict) for f in files):
            logging.error("Invalid file format received for clustering.")
            return []

        texts = [f.get("content", "").strip() for f in files]
        names = [f.get("name", "") for f in files]

        if not any(texts):
            logging.warning("No valid file contents found.")
            return []

        embeddings = extract_embeddings(texts)

        if embeddings.size == 0:
            logging.error("Embeddings are empty. Clustering cannot proceed.")
            return []

        # Normalize embeddings for cosine similarity
        embeddings = normalize(embeddings, axis=1)

        # Compute cosine similarity matrix
        cosine_sim = cosine_similarity(embeddings)
        logging.info(f"Cosine Similarity Matrix:\n{cosine_sim}")

        # Clustering based on similarity threshold (manual merging)
        clusters = []
        assigned = set()

        for i, name in enumerate(names):
            if name in assigned:
                continue  # Skip if already clustered
            
            new_cluster = [name]
            assigned.add(name)

            for j in range(len(names)):
                if i != j and cosine_sim[i, j] > threshold:
                    new_cluster.append(names[j])
                    assigned.add(names[j])

            clusters.append(new_cluster)

        # Compute average similarity for each cluster
        cluster_list = []
        for cluster_id, filenames in enumerate(clusters):
            indices = [names.index(f) for f in filenames]
            avg_similarity = round(np.mean(cosine_sim[np.ix_(indices, indices)]), 2) * 100

            cluster_list.append({
                "cluster_id": int(cluster_id),
                "names": filenames,
                "similarity": avg_similarity
            })

        logging.info(f"Clusters JSON: {json.dumps(cluster_list, indent=4)}")

        return cluster_list

    except Exception as e:
        logging.error(f"Clustering error: {str(e)}", exc_info=True)
        return []


@app.route('/cluster_python_folder/', methods=['POST'])
def cluster_python_folder():
    """
    API endpoint for clustering code files.
    """
    try:
        data = request.get_json()
        logging.info(f"Received Data: {json.dumps(data, indent=2)}")  # Log received data
        
        if not data or "files" not in data:
            return jsonify({"error": "Invalid request format"}), 400

        files_data = data["files"]
        if not isinstance(files_data, list):
            return jsonify({"error": "Files must be a list"}), 400

        clusters = cluster_code_files(files_data)

        if not clusters:
            logging.warning("No clusters were formed. Verify threshold or embeddings.")

        logging.info(f"Clusters formed: {clusters}")
        return jsonify({"clusters": clusters}), 200

    except Exception as e:
        logging.error(f"API error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500



if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(host='0.0.0.0', port=5000)