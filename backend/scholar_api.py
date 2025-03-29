from flask import Flask, request, jsonify
from flask_cors import CORS
from scholarly import scholarly

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests (so Node.js can call this API)

@app.route("/api/scholar", methods=["GET"])
def get_scholar_papers():
    field = request.args.get("field")
    if not field:
        return jsonify({"error": "Research field is required"}), 400

    try:
        search_query = scholarly.search_pubs(field)
        papers = []
        for _ in range(5):  # Get first 5 results
            article = next(search_query, None)
            if not article:
                break
            papers.append({
                "title": article["bib"].get("title", "No title"),
                "authors": article["bib"].get("author", "Unknown"),
                "year": article["bib"].get("pub_year", "Unknown"),
                "link": article.get("pub_url", "No link"),
                "citations": article.get("num_citations", 0),
            })

        return jsonify({"papers": papers})

    except Exception as e:
        print("Error fetching from Google Scholar:", e)
        return jsonify({"error": "Failed to fetch Google Scholar data"}), 500

if __name__ == "__main__":
    app.run(port=5001)  # Runs on port 5001
