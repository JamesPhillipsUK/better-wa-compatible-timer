""" start.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""
from dataclasses import dataclass
import setup
import timer
import time
import sys


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


def startDisplay() -> None:
    pass


def startEverything() -> None:
    pass


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