#!/bin/bash
## LINUX ONLY - automatically build and run the app.
## @author Jesse Phillips
## @version 0.0.1
python3 -m venv .env &&
source .env/bin/activate &&
pip3 install -r requirements.txt &&
python3 src/wizard.py
