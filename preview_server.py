#!/usr/bin/env python3
"""Dependency-free local preview for the TRICORE copied frontend."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

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


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--source", action="store_true", help="serve editable files from the package root instead of dist/")
    args = parser.parse_args()
    web_root = PROJECT if args.source else PROJECT / "dist"
    if not (web_root / "index.html").is_file():
        parser.error(f"index.html not found in {web_root}")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(SPAHandler, directory=str(web_root)))
    print(f"Serving {web_root} at http://127.0.0.1:{args.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
