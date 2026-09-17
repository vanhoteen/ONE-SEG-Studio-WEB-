"""Serve only this prototype on loopback, with no processing or RF endpoints."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

os.chdir(Path(__file__).resolve().parent)
print('ONE SEG Web Lab: http://localhost:8000 — no RF started', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8000), SimpleHTTPRequestHandler).serve_forever()
