#!/usr/bin/env python3
"""Dependency-free local preview for the TRICORE copied frontend."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

PROJECT = Path(__file__).resolve().parent

class SPAHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".hdr": "application/octet-stream",
        ".mp3": "audio/mpeg",
    }

    def translate_path(self, path):
        candidate = Path(super().translate_path(path))
        if candidate.is_file():
            return str(candidate)
        if not Path(path.split("?", 1)[0]).suffix:
            return str(Path(self.directory) / "index.html")
        return str(candidate)

    def do_POST(self):
        qa_output = getattr(self.server, "qa_output", None)
        if qa_output is None or self.path not in ("/__qa__/report", "/__qa__/video"):
            self.send_error(404)
            return

        device = self.headers.get("X-QA-Device", "").lower()
        if device not in ("desktop", "mobile"):
            self.send_error(400, "X-QA-Device must be desktop or mobile")
            return

        limit = 5 * 1024 * 1024 if self.path == "/__qa__/report" else 100 * 1024 * 1024
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self.send_error(411, "A valid Content-Length is required")
            return
        if length < 0:
            self.send_error(400, "Invalid Content-Length")
            return
        if length > limit:
            self.send_error(413, "Upload exceeds the endpoint size limit")
            return

        body = self.rfile.read(length)
        if len(body) != length:
            self.send_error(400, "Incomplete upload")
            return
        if self.path == "/__qa__/report":
            try:
                json.loads(body)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.send_error(400, "Report must contain valid JSON")
                return
            suffix = ".json"
        else:
            suffix = ".webm"

        target = qa_output / f"acceptance-{device}{suffix}"
        target.write_bytes(body)
        response = json.dumps({"saved": target.name, "bytes": len(body)}).encode()
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--source", action="store_true", help="serve editable files from the package root instead of dist/")
    parser.add_argument("--qa-output", type=Path, help="enable bounded QA report/video uploads into this directory")
    args = parser.parse_args()
    web_root = PROJECT if args.source else PROJECT / "dist"
    if not (web_root / "index.html").is_file():
        parser.error(f"index.html not found in {web_root}")
    qa_output = args.qa_output.resolve() if args.qa_output else None
    if qa_output:
        qa_output.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(SPAHandler, directory=str(web_root)))
    server.qa_output = qa_output
    print(f"Serving {web_root} at http://127.0.0.1:{args.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
