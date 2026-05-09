""" timer.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""

import subprocess
import json
import os


def getSetup(setupFile: str) -> dict:
    with open(setupFile, 'r', encoding="UTF-8") as fp:
        setup = json.load(fp)
    return setup


def runServer() -> None:
    setup = getSetup(f"src{os.sep}LEDSetup.json")
    subprocess.run(["python3",
                    "-m",
                    "http.server",
                    f"{setup["port"]}",
                    "--bind",
                    f"{setup["hostname"]}",
                    "--directory",
                    f"src{os.sep}http{os.sep}"])
