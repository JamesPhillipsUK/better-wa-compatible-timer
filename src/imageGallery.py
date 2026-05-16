""" imageGallery.py
    Handles setting up an image gallery.  Called by wizard.py.

Author: Jesse Phillips <jesse@jessephillips.uk>
Version 1.0.0
"""
import shutil
import glob
import sys
import os
galleryFolder = f"src{os.sep}http{os.sep}photo-gallery{os.sep}img"


class GalleryException(Exception):
    """ Custom exception to handle failed gallery setup.
    Extends:
        Exception
    """
    pass


def clearOldGallery() -> bool:
    """ Attempt to remove old gallery files.
    Returns:
        bool: true if able to remove the files.
    """
    if os.path.isdir(galleryFolder):
        try:
            toDelete = glob.glob(os.path.abspath(galleryFolder) + f"{os.sep}*")
            for file in toDelete:
                if not os.path.isdir(file):
                    os.remove(file)
            return True
        except PermissionError:
            return False
    else:
        try:
            os.makedirs(galleryFolder)
            return True
        except FileExistsError:
            return False


def createNewGallery(galleryData: str) -> bool:
    """ Copies the new gallery data into the gallery.
    Args:
        galleryData (str): the location of the images to put in the gallery.
    Returns:
        bool: true if able to add the images.
    """
    files = os.listdir(galleryData)
    for file in files:
        try:
            shutil.copy(os.path.join(galleryData, file), galleryFolder)
        except Exception:
            return False
    return True


def run(gallery: str) -> None:
    """ Makes the gallery folder when called.
    """
    if clearOldGallery():
        if createNewGallery(gallery):
            pass
        else:
            raise GalleryException("Could not create new gallery files.")
    else:
        raise GalleryException("Could not remove old gallery files.")

if __name__ == "__main__":
    gallery = sys.argv[-1]
    run(gallery)
