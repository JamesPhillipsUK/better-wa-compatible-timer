""" wizard.py
Graphical Wizard for using the system.

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 0.0.1

"""
import os
import sys
import setup
import subprocess
from PyQt5.QtWidgets import(QApplication,
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
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Better Timer Wizard") 

    def setupUI(self):
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
        goButton = QPushButton("Run!")
        goButton.pressed.connect(self.onClickedGo)
        mainLayout.addWidget(goButton)
        widget = QWidget()
        widget.setLayout(mainLayout)
        self.setCentralWidget(widget)

    def onClickedRadio(self):
        """ Sets the flag requested by the user when a radio button is pressed.
        """
        button = self.sender()
        if button.isChecked():
            self.currentFlag = button.value

    def onClickedFile(self):
        """ Selects the location of the WA Executable file.
        """
        name = QFileDialog.getOpenFileName(None, 'Open file')
        print(name[0])

    def onClickedGo(self):
        """ Runs the system when the go button is pressed.
        """
        if self.currentFlag == "":
            pass
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
        p = subprocess.run(processList)
        if self.currentFlag == "-f":
            dialogue = QMessageBox(self)
            dialogue.setWindowTitle("Notification")
            if p.returncode == 0:
                dialogue.setText("Initialisation complete!")
            else:
                dialogue.setText("Initialisation failed!")
            dialogue.exec()



def display() -> None:
    app = QApplication(sys.argv)
    window = Window()
    window.setupUI()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    display()
