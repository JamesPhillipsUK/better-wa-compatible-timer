""" stateManager.py
    Manages the state of messages passed by our API.

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 1.0.0
"""
import json
import os


class StateFile:
    """ Represents the message-state.json State File.
    """
    path: str = f"src{os.sep}http{os.sep}message-state.json"

    def __init__(self):
        pass

    def getDefaultState(self) -> str:
        """ Gets the default state the message-state.json file should have.
        """
        return "{\"pending\": \"\",\"active\": \"\"}\n"

    def normalise(self, message: str) -> str:
        """ Normalises a string to be: unpadded / max. 40 chars for display.
        Args:
            message (str): the message to be normalised.
        Returns:
            str: the normalised string.
        """
        message = message.strip()
        if len(message) > 40:
            message = message[:40]
        return message

    def readState(self) -> str:
        """ Reads the state of the message-state.json file.
            Defaults to the default state if the file is blank,
        Returns:
            str: the state of the file.
        """
        with open(self.path, 'r', encoding="UTF-8") as fp:
            stateJSON = json.load(fp)
            stateAttrs = ["pending", "active"]
            for attribute in stateAttrs:
                stateJSON[attribute] = self.normalise(stateJSON[attribute])
            state = json.dumps(stateJSON)
        if state is None or state.strip() is None:
            state = self.getDefaultState()
        return state

    def writeState(self, stateDict: dict) -> None:
        """ Writes a state to the state file.
        Args:
            stateDict (dict): a dictionary containing the updated state.
        """
        with open(self.path, 'w', encoding="UTF-8") as fp:
            json.dump(stateDict, fp)

    def handlePending(self, request: bytes) -> str:
        """ Handles requests to /pending
        Args:
            request (str): the request string made.
        Returns:
            str: the updated state.
        """
        state = self.readState()
        stateDict = json.loads(state)
        requestDict = json.loads(request.decode())
        stateDict["pending"] = self.normalise(requestDict["message"])
        print(stateDict["pending"])
        self.writeState(stateDict)
        return self.readState()

    def clearAttribute(self, attr: str) -> str:
        """ Clears a named attribute from the state.
        Args:
            attr (str): the name of the attribute to clear.
        Returns:
            str: the updated state.
        """
        state = self.readState()
        stateDict = json.loads(state)
        stateDict[attr] = ""
        self.writeState(stateDict)
        return self.readState()

    def clearPending(self) -> str:
        """ Handles requests to /clear-pending
        Returns:
            str: the updated state.
        """
        return self.clearAttribute("pending")

    def clearActive(self) -> str:
        """ Handles requests to /clear-active
        Returns:
            str: the updated state.
        """
        return self.clearAttribute("active")

    def consume(self) -> str:
        """ Handles requests to /consume
        Returns:
            str: the updated state.
        """
        state = self.readState()
        stateDict = json.loads(state)
        stateDict["active"] = stateDict["pending"]
        stateDict["pending"] = ""
        self.writeState(stateDict)
        return self.readState()
