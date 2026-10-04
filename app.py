from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()

    text = data.get("text", "").strip()
    source = data.get("source", "auto")
    target = data.get("target", "en")

    if not text:
        return jsonify({
            "error": "Please enter some text to translate."
        }), 400

    # MyMemory uses "auto" differently, so we use a simple
    # default source language when auto-detection is selected.
    if source == "auto":
        source = "en"

    language_pair = f"{source}|{target}"

    url = "https://api.mymemory.translated.net/get"

    params = {
        "q": text,
        "langpair": language_pair
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        result = response.json()

        translated_text = result["responseData"]["translatedText"]

        return jsonify({
            "translation": translated_text
        })

    except requests.exceptions.RequestException:
        return jsonify({
            "error": "Unable to connect to the translation service."
        }), 500

    except (KeyError, TypeError):
        return jsonify({
            "error": "Invalid response received from the translation service."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)