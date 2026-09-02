#!/usr/bin/env python3
"""
Soniq - Protected Static Server
Serves aurora-music/ as the web root with basic server-side protections.
"""

import http.server
import socketserver
import os
import sys
import json
import hashlib
import time
import ipaddress
from pathlib import Path

PORT = 8082
ROOT = Path(__file__).parent / "aurora-music"
CONFIG_PATH = Path(__file__).parent / "server-config.json"
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 120

BLOCKED_IPS = set()
RATE_LIMITS = {}
ALLOWED_ORIGINS = {"*"}


def load_config():
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "port": PORT,
        "allowed_origins": ["*"],
        "rate_limit_max": RATE_LIMIT_MAX,
        "rate_limit_window": RATE_LIMIT_WINDOW,
        "require_auth": False,
        "auth_header": "X-Soniq-Auth",
        "auth_token": ""
    }


CONFIG = load_config()
PORT = CONFIG.get("port", PORT)
ALLOWED_ORIGINS = set(CONFIG.get("allowed_origins", ["*"]))
RATE_LIMIT_MAX = int(CONFIG.get("rate_limit_max", RATE_LIMIT_MAX))
RATE_LIMIT_WINDOW = int(CONFIG.get("rate_limit_window", RATE_LIMIT_WINDOW))
REQUIRE_AUTH = bool(CONFIG.get("require_auth", False))
AUTH_HEADER = CONFIG.get("auth_header", "X-Soniq-Auth")
AUTH_TOKEN = CONFIG.get("auth_token", "")


def is_ip_blocked(client_ip):
    try:
        addr = ipaddress.ip_address(client_ip)
        if addr.is_private or addr.is_loopback or addr.is_reserved:
            return False
    except ValueError:
        pass
    return client_ip in BLOCKED_IPS


def check_rate_limit(client_ip):
    now = time.time()
    window = RATE_LIMITS.get(client_ip)
    if not window:
        RATE_LIMITS[client_ip] = {"count": 1, "start": now}
        return True
    if now - window["start"] > RATE_LIMIT_WINDOW:
        RATE_LIMITS[client_ip] = {"count": 1, "start": now}
        return True
    window["count"] += 1
    if window["count"] > RATE_LIMIT_MAX:
        return False
    return True


def check_auth(headers):
    if not REQUIRE_AUTH:
        return True
    token = headers.get(AUTH_HEADER, "")
    if not AUTH_TOKEN:
        return True
    return token == AUTH_TOKEN


class SoniqHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if not ROOT.exists():
            return super().translate_path(path)
        path = super().translate_path(path)
        if Path(path) == ROOT:
            return str(ROOT)
        candidate = ROOT / path.lstrip("/")
        if candidate.exists():
            return str(candidate)
        index = ROOT / path.lstrip("/") / "index.html"
        if index.exists():
            return str(index)
        return str(ROOT / "index.html")

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if "*" in ALLOWED_ORIGINS or origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin or "*")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        client_ip = self.client_address[0]
        if is_ip_blocked(client_ip):
            self.send_response(403)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Blocked")
            return
        if not check_rate_limit(client_ip):
            self.send_response(429)
            self.send_header("Retry-After", "60")
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Too Many Requests")
            return
        if not check_auth(self.headers):
            self.send_response(401)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            return
        path = self.translate_path(self.path)
        if Path(path).is_dir():
            path = str(ROOT / "index.html")
        try:
            with open(path, "rb") as f:
                data = f.read()
            ext = Path(path).suffix.lower()
            mime = {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".json": "application/json",
                ".svg": "image/svg+xml",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".ico": "image/x-icon",
                ".woff2": "font/woff2",
                ".woff": "font/woff",
                ".ttf": "font/ttf",
            }.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h1>Not Found</h1>")

    def log_message(self, format, *args):
        try:
            sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format % args))
        except Exception:
            pass


def main():
    if not ROOT.exists():
        print(f"Root folder not found: {ROOT}")
        sys.exit(1)
    os.chdir(ROOT)
    with socketserver.TCPServer(("", PORT), SoniqHandler) as httpd:
        print(f"Serving {ROOT}")
        print(f"Protection: rate_limit={RATE_LIMIT_MAX}/{RATE_LIMIT_WINDOW}s auth={REQUIRE_AUTH}")
        print(f"http://localhost:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")


if __name__ == "__main__":
    main()
