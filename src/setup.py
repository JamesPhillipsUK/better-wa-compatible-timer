""" setup.py

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1
"""
import platform
import os


class UnsupportedPlatformException(Exception):
    """ Exception triggered if a platform is not supported.
    """
    pass


def getPlatform() -> str:
    """ Gets the current platform
    Returns:
        str: the platform kernel
    Throws:
        PlatformException if the platform is not supported.
    """
    pfm = platform.system()
    if pfm == "Darwin" or pfm == "Linux" or pfm == "Windows":
        return pfm
    else:
        raise UnsupportedPlatformException(f"Platform not supported. {pfm}")


def run() -> bool:
    try:
        pfm = getPlatform()
    except UnsupportedPlatformException:
        return False
    if pfm == "Windows":
        batchFile = os.path.abspath(f"src{os.sep}setup-led-display.bat")
        from ctypes import windll
        windll.shell32.ShellExecuteW(None,
                                     "runas",
                                     "cmd.exe",
                                     " ".join(["/c", batchFile]),
                                     None,
                                     1)
    return True
