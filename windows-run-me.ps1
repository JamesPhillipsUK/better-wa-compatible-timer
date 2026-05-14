#!/bin/bash
## WINDOWS ONLY - automatically build and run the app.
## @author Jesse Phillips
## @version 1.0.0
py -m venv .env
.env\Scripts\activate.ps1
pip3 install -r requirements.txt
py src\wizard.py

