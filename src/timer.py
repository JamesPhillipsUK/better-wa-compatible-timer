""" timer.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""

import subprocess
import json
import os
import http.server
import socketserver
from typing import Tuple
from http import HTTPStatus


def getSetup(setupFile: str) -> dict:
    with open(setupFile, 'r', encoding="UTF-8") as fp:
        setup = json.load(fp)
    return setup


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,
                 request: bytes,
                 client_address: Tuple[str, int],
                 server: socketserver.BaseServer):
        super().__init__(request, client_address, server)

    def apiResponse(self, file: str) -> bytes:
        if file.endswith(".json"):
            with open(file, 'r', encoding="UTF-8") as fp:
                jSON = json.load(fp)
            return json.dumps(jSON).encode()
        elif file.endswith(".js") or \
             file.endswith(".html") or \
             file.endswith(".css"):
            with open(file, 'r', encoding="UTF-8") as fp:
                return fp.read().encode()

    def do_GET(self):
        if self.path.startswith("/api"):
            self.send_response(HTTPStatus.OK)

            self.end_headers()
        elif self.path.startswith('/'):
            requestedFile = f"src{os.sep}http{self.path.replace('/', os.sep)}"
            if not os.path.exists(requestedFile):
                self.send_response(404)
                self.end_headers()
                return
            self.send_response(HTTPStatus.OK)
            if self.path.endswith(".json"):
                self.send_header("Content-Type",
                                 "application/json; charset=utf-8")
            elif self.path.endswith(".js"):
                self.send_header("Content-Type",
                                 "application/javascript; charset=utf-8")
            elif self.path.endswith(".html"):
                self.send_header("Content-Type",
                                 "text/html; charset=utf-8")
            elif self.path.endswith(".css"):
                self.send_header("Content-Type",
                                 "text/css; charset=utf-8")
            else:
                self.send_response(500)
                self.end_headers()
                return
            self.end_headers()
            self.wfile.write(bytes(self.apiResponse(requestedFile)))


def runServer() -> None:
    setup = getSetup(f"src{os.sep}LEDSetup.json")
    server = socketserver.TCPServer((setup["hostname"], setup["port"]),
                                    Handler)
    server.serve_forever()

#def runServer() -> None:
#    setup = getSetup(f"src{os.sep}LEDSetup.json")
#    subprocess.run(["python3",
#                    "-m",
#                    "http.server",
#                    f"{setup["port"]}",
#                    "--bind",
#                    f"{setup["hostname"]}",
#                    "--directory",
#                    f"src{os.sep}http{os.sep}"])
