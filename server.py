"""OrderPad server entry point.

The production Flask application lives in servercode/server.py.
This wrapper keeps the project runnable from the repository root.
"""
from servercode.server import app


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
