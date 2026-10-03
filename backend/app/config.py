import os

from dotenv import load_dotenv

load_dotenv()

# Reads the database address from the environment, falling back to a local SQLite file
def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./budget.db")
   
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = _database_url()

# Frontend addresses allowed to call this API
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

DEFAULT_BUDGET = 500.0

# Must match the category ids in src/utils/constants.js
CATEGORY_IDS = {
    "food",
    "transport",
    "study",
    "accommodation",
    "entertainment",
    "health",
    "shopping",
    "other",
}