""" start.py
    Starts and manages the timer system.  Can be called directly,
    or by wizard.py.

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
    executableElsewhere: bool = False
    executable: str = ""


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


def getMessageControllerURL(setupFile: str) -> str:
    """ Gets the message controller URL based on the settings in LEDSetup.json.
    Args:
        setupFile (str): the filepath to LEDSetup.json
    Returns:
        str: the URL for the message controller.
    """
    with open(setupFile, 'r', encoding="UTF-8") as fp:
        lEDSetup = json.load(fp)
    if lEDSetup["ssl"]:
        url = "https://"
    else:
        url = "http://"
    url += lEDSetup["hostname"]
    url += f":{lEDSetup["port"]}/message-controller/messages.html"
    return url


def openDisplayInBrowser() -> bool:
    """ Opens a browser window containing the LED Display.
    Returns:
        bool: true if the window could be opened.
    """
    displayURL = getDisplayURL(f"src{os.sep}LEDSetup.json")
    messageURL = getMessageControllerURL(f"src{os.sep}LEDSetup.json")
    display = webbrowser.open_new(displayURL)
    if Flags.displayOnly:
        return display
    message = webbrowser.open_new(messageURL)
    waTiming = webbrowser.open_new("http://127.0.0.1:5000")
    if display and message and waTiming:
        return True
    return False


def startDisplay() -> None:
    """ Starts the display and opens it in browser.
        Does not close until the display has died.
    """
    timerThread = threading.Thread(target=timer.runServer, args=[])
    timerThread.start()
    time.sleep(1)
    openDisplayInBrowser()
    timerThread.join()


def startWATimingSystem() -> None:
    """ Starts the WA timing system.
    """
    try:
        pfm = setup.getPlatform()
    except setup.UnsupportedPlatformException as e:
        raise FailedSetupException(str(e))
    if Flags.executableElsewhere:
        subprocess.run([Flags.executable])
    elif pfm == "Linux":
        subprocess.run([f"src{os.sep}world_archery_timing_system-linux-x64"])
    elif pfm == "Windows":
        subprocess.run([f"src{os.sep}world_archery_timing_system-win-x64.exe"])
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
        if item.startswith("-"):
            if 'e' in item:
                Flags.everything = True
            if 'f' in item:
                Flags.firstTime = True
            if 'd' in item:
                Flags.displayOnly = True
            if 'x' in item:
                Flags.executableElsewhere = True
    if Flags.executableElsewhere:
        Flags.executable = sys.argv[-1]
        if not os.path.isfile(Flags.executable):
            raise FailedSetupException("Executable file not found.")
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
