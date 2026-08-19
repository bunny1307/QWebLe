"""OrderPad server entry point.

The production Flask application lives in servercode/server.py.
This wrapper keeps the project runnable from the repository root for both
local development and production WSGI runners (Gunicorn / Waitress) on Render.
"""
import os
from servercode.server import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
