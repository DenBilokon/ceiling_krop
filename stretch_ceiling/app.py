from http import cookies
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import json
import secrets
import sqlite3
import webbrowser


def load_env_file():
    base_dir = Path(__file__).resolve().parent
    candidates = [base_dir / ".env", base_dir.parent / ".env"]
    for env_file in candidates:
        if not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", None)
SESSION_COOKIE = "stretch_admin_session"
SESSIONS = set()


def db_path():
    return Path(__file__).resolve().parent / "data" / "leads.db"


def site_content_path():
    return Path(__file__).resolve().parent / "data" / "site_content.json"


def init_db():
    path = db_path()
    path.parent.mkdir(exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def json_response(handler, payload, status=200):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class SiteHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def is_admin(self):
        header = self.headers.get("Cookie", "")
        jar = cookies.SimpleCookie()
        jar.load(header)
        token = jar.get(SESSION_COOKIE)
        return bool(token and token.value in SESSIONS)

    def require_admin(self):
        if self.is_admin():
            return True
        json_response(self, {"ok": False, "error": "Unauthorized"}, 401)
        return False

    def do_GET(self):
        if self.path == "/api/session":
            json_response(self, {"ok": True, "authenticated": self.is_admin()})
            return

        if self.path == "/api/site-content":
            path = site_content_path()
            if not path.exists():
                json_response(self, {"ok": True, "content": None})
                return
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                content = None
            json_response(self, {"ok": True, "content": content})
            return

        if self.path == "/api/leads":
            if not self.require_admin():
                return
            with sqlite3.connect(db_path()) as connection:
                connection.row_factory = sqlite3.Row
                rows = connection.execute(
                    "SELECT id, name, phone, message, created_at FROM leads ORDER BY id DESC"
                ).fetchall()
            json_response(self, {"ok": True, "leads": [dict(row) for row in rows]})
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/login":
            payload = self.read_json()
            if payload.get("password") != ADMIN_PASSWORD:
                json_response(self, {"ok": False, "error": "Wrong password"}, 403)
                return
            token = secrets.token_urlsafe(32)
            SESSIONS.add(token)
            body = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Set-Cookie", f"{SESSION_COOKIE}={token}; HttpOnly; SameSite=Lax; Path=/")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path == "/api/logout":
            header = self.headers.get("Cookie", "")
            jar = cookies.SimpleCookie()
            jar.load(header)
            token = jar.get(SESSION_COOKIE)
            if token:
                SESSIONS.discard(token.value)
            self.send_response(204)
            self.send_header("Set-Cookie", f"{SESSION_COOKIE}=; Max-Age=0; Path=/")
            self.end_headers()
            return

        if self.path == "/api/leads":
            payload = self.read_json()
            name = str(payload.get("name", "")).strip()
            phone = str(payload.get("phone", "")).strip()
            message = str(payload.get("message", "")).strip()
            if not name or not phone:
                json_response(self, {"ok": False, "error": "Name and phone are required"}, 400)
                return
            with sqlite3.connect(db_path()) as connection:
                connection.execute(
                    "INSERT INTO leads (name, phone, message) VALUES (?, ?, ?)",
                    (name, phone, message),
                )
            json_response(self, {"ok": True})
            return

        if self.path == "/api/site-content":
            if not self.require_admin():
                return
            payload = self.read_json()
            content = payload.get("content")
            if not isinstance(content, dict):
                json_response(self, {"ok": False, "error": "Content must be an object"}, 400)
                return
            path = site_content_path()
            path.parent.mkdir(exist_ok=True)
            path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
            json_response(self, {"ok": True})
            return

        json_response(self, {"ok": False, "error": "Not found"}, 404)

    def do_DELETE(self):
        if self.path.startswith("/api/leads/"):
            if not self.require_admin():
                return
            lead_id = self.path.rsplit("/", 1)[-1]
            if not lead_id.isdigit():
                json_response(self, {"ok": False, "error": "Bad lead id"}, 400)
                return
            with sqlite3.connect(db_path()) as connection:
                connection.execute("DELETE FROM leads WHERE id = ?", (int(lead_id),))
            json_response(self, {"ok": True})
            return

        json_response(self, {"ok": False, "error": "Not found"}, 404)


def main():
    project_dir = Path(__file__).resolve().parent
    os.chdir(project_dir)
    init_db()

    server = ThreadingHTTPServer((HOST, PORT), SiteHandler)
    browser_host = "127.0.0.1" if HOST == "0.0.0.0" else HOST
    url = f"http://{browser_host}:{PORT}/"

    print(f"Stretch ceiling site is running: {url}")
    print("Admin page:", f"{url}admin.html")
    print("Press Ctrl+C to stop the server.")

    if os.environ.get("OPEN_BROWSER", "1") == "1":
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
