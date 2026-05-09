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

    def apiResponse(self, url: str) -> bytes:
        if url.endswith(".json"):
            url = url.replace('/', f"{os.sep}")
            with open(f"src{os.sep}http{url}", 'r', encoding="UTF-8") as fp:
                jSON = json.load(fp)
            return json.dumps(jSON).encode()

    def do_GET(self):
        if self.path.startswith('/'):
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(bytes(self.apiResponse(self.path)))


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
