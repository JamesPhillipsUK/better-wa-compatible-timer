""" wizard.py
Graphical Wizard for using the system.

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 1.0.0

"""
import os
import sys
import setup
import threading
import subprocess
from PyQt5.QtCore import QTimer
from PyQt5.QtWidgets import (QApplication,
                             QMainWindow,
                             QVBoxLayout,
                             QHBoxLayout,
                             QRadioButton,
                             QPushButton,
                             QWidget,
                             QMessageBox,
                             QFileDialog)


class Window(QMainWindow):
    """ Defines the window for the wizard.
    Extends:
        QMainWindow
    """
    currentFlag: str = ""
    executable: str = ""
    processReturn: int = 99
    initialised: bool = False

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Better Timer Wizard")

    def setupUI(self) -> None:
        """ Builds the GUI for the system.
        """
        mainLayout = QVBoxLayout()
        menuLayout = QHBoxLayout()
        button = QRadioButton("Initialise")
        button.value = "-f"
        button.toggled.connect(self.onClickedRadio)
        menuLayout.addWidget(button)
        button = QRadioButton("Start Everything")
        button.value = "-e"
        button.toggled.connect(self.onClickedRadio)
        menuLayout.addWidget(button)
        button = QRadioButton("Start Display Only")
        button.value = "-d"
        button.toggled.connect(self.onClickedRadio)
        menuLayout.addWidget(button)
        mainLayout.addLayout(menuLayout)
        fileButton = QPushButton("Find WA Timing System Install (optional).")
        fileButton.pressed.connect(self.onClickedFile)
        mainLayout.addWidget(fileButton)
        galleryButton = QPushButton("Run Image Gallery (optional).")
        galleryButton.pressed.connect(self.onClickedGallery)
        mainLayout.addWidget(galleryButton)
        goButton = QPushButton("Run!")
        goButton.pressed.connect(self.onClickedGo)
        mainLayout.addWidget(goButton)
        widget = QWidget()
        widget.setLayout(mainLayout)
        self.setCentralWidget(widget)
        self.timer = QTimer()
        self.timer.setInterval(100)
        self.timer.timeout.connect(self.handleProcessReturn)
        self.timer.start()

    def onClickedRadio(self) -> None:
        """ Sets the flag requested by the user when a radio button is pressed.
        """
        button = self.sender()
        if button.isChecked():
            self.currentFlag = button.value

    def onClickedFile(self) -> None:
        """ Selects the location of the WA Executable file.
        """
        name = QFileDialog.getOpenFileName(None, 'Open file')
        self.executable = name[0]

    def onClickedGallery(self) -> None:
        """ Selects the location of the image gallery.
        """
        dirDialogue = QFileDialog(self)
        dirDialogue.setWindowTitle('Select a Folder')
        dirDialogue.setFileMode(QFileDialog.Directory)
        dirDialogue.setOption(QFileDialog.ShowDirsOnly, True)
        if dirDialogue.exec_() == QFileDialog.Accepted:
            folder = dirDialogue.selectedFiles()[0]
            import imageGallery
            imageGallery.run(folder)
        dialogue = QMessageBox(None)
        dialogue.setWindowTitle("Notification")
        dialogue.setText("Please reload the photo gallery browser window once the timing system is operational.")
        dialogue.exec()

    def onClickedGo(self) -> None:
        """ Runs the system when the go button is pressed.
        """
        if self.currentFlag == "":
            pass
        if self.currentFlag == "-f" and self.initialised:
            dialogue = QMessageBox(None)
            dialogue.setWindowTitle("Notification")
            dialogue.setText("Already initialised!")
            dialogue.exec()
            return
        pfm = setup.getPlatform()
        pyCommand = "python3"
        if pfm == "Windows":
            pyCommand = "py"
        processList = [pyCommand,
                       f"src{os.sep}start.py",
                       self.currentFlag]
        if self.executable != "":
            processList.append("-x")
            processList.append(self.executable)
        self.runThreadedSubprocess(processList)

    def runThreadedSubprocess(self, commandList: list) -> None:
        """ Creates a thread to run a subprocess on a non-GUI-thread.
        Args:
            commandList (list): the list of commands to pass to subprocess.run.
        """
        t = threading.Thread(target=self.runSubprocess,
                             args=([commandList]))
        t.start()

    def runSubprocess(self, commandList) -> None:
        """ Creates a subprocess (run this on a non-GUI-thread).
        Args:
            commandList (list): the list of commands to pass to subprocess.run.
        """
        p = subprocess.run(commandList)
        self.processReturn = p.returncode

    def handleProcessReturn(self) -> None:
        """ Handles what to do when a subprocess thread has returned.
            Because we can't create QMessageBox-es in the thread, do them here.
        """
        if self.currentFlag == "-f":
            if self.processReturn == 99:
                pass
            elif self.processReturn == 0:
                self.timer.stop()
                dialogue = QMessageBox(None)
                dialogue.setWindowTitle("Notification")
                dialogue.setText("Initialisation complete!")
                dialogue.exec()
                self.initialised = True
            else:
                self.processReturn = 99
                dialogue = QMessageBox(None)
                dialogue.setWindowTitle("Notification")
                dialogue.setText("Initialisation failed!")
                dialogue.exec()


def display() -> None:
    """ Displays the app.
    """
    app = QApplication(sys.argv)
    window = Window()
    window.setupUI()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    display()
