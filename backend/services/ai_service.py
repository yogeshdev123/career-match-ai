
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai


BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from the .env file.")

# Reuse one Gemini client
client = genai.Client(api_key=API_KEY)


def test_gemini_connection():

    response = client.models.generate_content(
        model=MODEL,
        contents="Reply with exactly: CareerMatch AI connection successful."
    )

    return response.text


def generate_gemini_response(prompt):

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text
