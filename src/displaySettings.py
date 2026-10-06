"""Read and save the persistent display settings."""

import json
import os
from pathlib import Path


SETTINGS_PATH = Path(__file__).resolve().parent / "display-settings.json"
VALID_STYLES = ("ABCD", "ABCDEF")


def read_settings():
    """Read saved settings, using AB/CD if the file is missing."""
    try:
        with SETTINGS_PATH.open("r", encoding="utf-8") as file:
            settings = json.load(file)
    except FileNotFoundError:
        return {"twoDetailStyle": "ABCD"}

    if not isinstance(settings, dict):
        raise ValueError("Display settings must be a JSON object.")

    style = settings.get("twoDetailStyle", "ABCD")

    if style not in VALID_STYLES:
        raise ValueError("twoDetailStyle must be ABCD or ABCDEF.")

    settings["twoDetailStyle"] = style
    return settings


def save_settings(style):
    """Validate and save the selected two-detail style."""
    if style not in VALID_STYLES:
        raise ValueError("twoDetailStyle must be ABCD or ABCDEF.")

    settings = read_settings()
    settings["twoDetailStyle"] = style

    temporary_path = SETTINGS_PATH.with_suffix(".json.tmp")

    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(settings, file, indent=4)
        file.write("\n")

    os.replace(temporary_path, SETTINGS_PATH)
    return settings