""" timer.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""

import json
import os
import http.server
import socketserver
from typing import Tuple
from http import HTTPStatus
from stateManager import StateFile


def getSetup(setupFile: str) -> dict:
    """ Gets the setup data from LEDSetup.json.
    Args:
        setupFile (str): the filepath to the setup file.
    Returns:
        dict: the setup data.
    """
    with open(setupFile, 'r', encoding="UTF-8") as fp:
        setup = json.load(fp)
    return setup


class HTTPServerHandler(http.server.SimpleHTTPRequestHandler):
    state = StateFile()

    def __init__(self,
                 request: bytes,
                 client_address: Tuple[str, int],
                 server: socketserver.BaseServer):
        super().__init__(request, client_address, server)

    def generateResponse(self, file: str) -> bytes:
        """ Generates an HTTP response.
        Args:
            file (str): the file the user is asking for.
        Returns:
            bytes: the file data, encoded as a stream of bytes.
        """
        if file.endswith(".json"):
            with open(file, 'r', encoding="UTF-8") as fp:
                jSON = json.load(fp)
            return json.dumps(jSON).encode()
        elif (file.endswith(".js") or
              file.endswith(".html") or
              file.endswith(".css")):
            with open(file, 'r', encoding="UTF-8") as fp:
                return fp.read().encode()
        return None

    def generateAPIResponseHeaders(self, name: str) -> None:
        """ Generates headers for responding to API requests.
            Sets them using self.send_header - no need to return anything.
        """
        match name:
            case "/message-state" | "/pending" | "/clear-pending" | "consume" \
                 | "/clear-active":
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header("Content-Type",
                                 "application/json; charset=utf-8")

    def generateAPIResponse(self, name: str, data: str = None) -> bytes:
        """ Generates an API response.
        """
        match name:
            case "/message-state":
                return self.state.readState()
            case "/pending":
                return self.state.handlePending(data)
            case "/clear-pending":
                return self.state.clearPending()
            case "/consume":
                return self.state.consume()
            case "/clear-active":
                return self.state.clearActive()

    def handleInternalServerError(self) -> None:
        """ Handles server-side errors.
            Any error encountered here is assumed to be a 500 error.
        """
        self.send_response(500)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(bytes("500: Internal Server Error.".encode()))

    def do_POST(self):
        """ Handles all POST requests.
            Some sections of Philip's API implementation POST, others
            prefer to GET.  Thanks, Philip - I hate this.
        """
        if self.path.startswith("/api/message-state/"):
            if self.path.endswith("/pending"):
                self.send_response(HTTPStatus.OK)
                self.generateAPIResponseHeaders("/pending")
                self.end_headers()
                data = self.rfile.read(int(self.headers['Content-Length']))
                self.wfile.write(bytes(self.generateAPIResponse("/pending",
                                                                data),
                                       encoding='utf8'))
            elif self.path.endswith("/clear-pending"):
                self.send_response(HTTPStatus.OK)
                self.generateAPIResponseHeaders("/clear-pending")
                self.end_headers()
                self.wfile.write(
                    bytes(self.generateAPIResponse("/clear-pending"),
                          encoding='utf8'))
            elif self.path.endswith("/consume"):
                self.send_response(HTTPStatus.OK)
                self.generateAPIResponseHeaders("/consume")
                self.end_headers()
                self.wfile.write(bytes(self.generateAPIResponse("/consume"),
                                       encoding='utf8'))
            elif self.path.endswith("/clear-active"):
                self.send_response(HTTPStatus.OK)
                self.generateAPIResponseHeaders("/clear-active")
                self.end_headers()
                self.wfile.write(
                    bytes(self.generateAPIResponse("/clear-active"),
                          encoding='utf8'))
            else:
                self.handleInternalServerError()
        else:
            self.handleInternalServerError()

    def do_GET(self):
        """ Handles all GET requests.
        """
        if self.path == "/api/message-state":
            self.send_response(HTTPStatus.OK)
            self.generateAPIResponseHeaders("/message-state")
            self.end_headers()
            self.wfile.write(bytes(self.generateAPIResponse("/message-state"),
                                   encoding='utf8'))
        elif self.path.startswith('/'):
            requestedFile = f"src{os.sep}http{self.path.replace('/', os.sep)}"
            if not os.path.exists(requestedFile):
                self.send_response(404)
                self.send_header("Content-Type",
                                 "text/plain; charset=utf-8")
                self.end_headers()
                self.wfile.write(bytes("404: File Not Found.".encode()))
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
                self.handleInternalServerError()
                return
            self.end_headers()
            self.wfile.write(bytes(self.generateResponse(requestedFile)))
        else:
            self.handleInternalServerError()
            return


def runServer() -> None:
    """ Runs the internal server for the LED Displays and messaging API.
    """
    setup = getSetup(f"src{os.sep}LEDSetup.json")
    server = socketserver.TCPServer((setup["hostname"], setup["port"]),
                                    HTTPServerHandler)
    server.serve_forever()
