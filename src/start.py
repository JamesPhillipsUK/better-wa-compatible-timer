""" start.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""
from dataclasses import dataclass
import subprocess
import webbrowser
import threading
import platform
import setup
import timer
import time
import json
import sys
import os


@dataclass
class Flags:
    """Flags set by the user.  How do they want to run the system?
    """
    everything: bool = False
    displayOnly: bool = False
    firstTime: bool = False


class FailedSetupException(Exception):
    """ Custom exception to handle failed setup.
    Extends:
        Exception
    """
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
    """ Starts the display and opens it in browser.
        Does not close until the display has died.
    """
    timerThread = threading.Thread(target=timer.runServer, args=[])
    timerThread.start()
    time.sleep(1)
    openDisplayInBrowser()
    timerThread.join()


def getPlatform() -> str:
    """ Gets the current platform
    Returns:
        str: the platform kernel
    Throws:
        FailedSetupException if the platform is not supported.
    """
    pfm = platform.system()
    if pfm == "Darwin" or pfm == "Linux" or pfm == "Windows":
        return pfm
    else:
        raise FailedSetupException(f"Platform not supported. {pfm}")


def startWATimingSystem() -> None:
    """ Starts the WA timing system.
    """
    pfm = getPlatform()
    print(pfm)
    if pfm == "Linux":
        subprocess.run([f"src{os.sep}world_archery_timing_system-linux-x64"])
    elif pfm == "Windows":
        subprocess.run(["start",
                        f"src{os.sep}world_archery_timing_system-win-x64.exe"])
    else:
        subprocess.run([f"src{os.sep}world_archery_timing_system-macos-arm64"])


def startEverything() -> None:
    """ Starts everything.
    """
    # Start WA timing system
    timingSystemThread = threading.Thread(target=startWATimingSystem, args=[])
    timingSystemThread.start()
    # Start display
    startDisplay()
    timingSystemThread.join()


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