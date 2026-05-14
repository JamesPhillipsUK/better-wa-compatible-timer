#!/bin/bash
## LINUX ONLY - automatically build and run the app.
## @author Jesse Phillips
## @version 1.0.0
python3 -m venv .env &&
source .env/bin/activate &&
pip3 install -r requirements.txt &&
python3 src/wizard.py
