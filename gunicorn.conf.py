import os

# Render dynamically assigns $PORT or reads from environment variables.
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
threads = int(os.environ.get("PYTHON_THREADS", "4"))
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
