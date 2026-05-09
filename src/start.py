""" start.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""
from dataclasses import dataclass
import webbrowser
import threading
import setup
import timer
import time
import json
import sys
import os


@dataclass
class Flags:
    everything: bool = False
    displayOnly: bool = False
    firstTime: bool = False


class FailedSetupException(Exception):
    pass


def runSetup() -> None:
    """ Runs the first-time setup script.
    """
    if not setup.run():
        raise FailedSetupException("Failed to set up LED Display.")


def getDisplayURL(setupFile: str) -> str:
    """ Gets the LED display URL based on the settings in LEDSetup.json.
    Args:
        setupFile (str): the filepath to LEDSetup.json
    Returns:
        str: the URL for the LED display.
    """
    with open(setupFile, 'r', encoding="UTF-8") as fp:
        lEDSetup = json.load(fp)
    if lEDSetup["ssl"]:
        url = "https://"
    else:
        url = "http://"
    url += lEDSetup["hostname"]
    url += f":{lEDSetup["port"]}/"
    url += lEDSetup["page"]
    return url


def openDisplayInBrowser() -> bool:
    """ Opens a browser window containing the LED Display.
    Returns:
        bool: true if the window could be opened.
    """
    url = getDisplayURL(f"src{os.sep}LEDSetup.json")
    return webbrowser.open_new(url)


def startDisplay() -> None:
    timerThread = threading.Thread(target=timer.runServer, args=[])
    timerThread.start()
    time.sleep(1)
    openDisplayInBrowser()
    timerThread.join()


def startEverything() -> None:
    """"""
    # Start WA timing system

    # Start display
    startDisplay()


if __name__ == "__main__":
    """ Handles arguments, runs setup if needed, runs timer.
    """
    for item in sys.argv:
        match item:
            case "-e":
                Flags.everything = True
            case "-f":
                Flags.firstTime = True
            case "-d":
                Flags.displayOnly = True
    if Flags.everything and Flags.displayOnly:
        Flags.displayOnly = False
    if not Flags.everything and not Flags.displayOnly and not Flags.firstTime:
        sys.exit(1)
    if Flags.firstTime:
        runSetup()
    if Flags.everything:
        startEverything()
    elif Flags.displayOnly:
        startDisplay()