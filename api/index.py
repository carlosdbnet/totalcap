import sys
import os

# Adds the project root to the system path so "backend" can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the FastAPI app from backend.main
from backend.main import app
