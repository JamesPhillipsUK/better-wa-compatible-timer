/** JavaScript for photo-gallery.html.
 *  @author: Jesse Phillips
 *  @version: 1.1.0
 **/
const MESSAGE_API_BASE = "http://localhost:5500";
const GALLERY_IMG = document.getElementById("gallery-img")
let imageArray = [];
let currentImageIndex = -1;

/**
 * Performs a GET request to get the list of images to display. 
 **/
async function fetchImageList() {
  const response = await fetch(MESSAGE_API_BASE + "/api/get-image-list",
                               {
                                 method: "GET",
                                 headers: { "Accept": "application/json" }
                               });
  const data = await response.json();
  data.images.forEach(image => {
    imageArray.push(image);
  });
}

/**
 * Gets each new image requested from the list.
 **/
function getNewImage() {
  let loaded = false;
  if (currentImageIndex == imageArray.length - 1)
    currentImageIndex = 0;
  else
    currentImageIndex++;
  GALLERY_IMG.src = "./img/" + imageArray[currentImageIndex];
  GALLERY_IMG.alt = imageArray[currentImageIndex];
  GALLERY_IMG.onload = function () {
    if (!loaded){
      // Centres the image vertically and forces reload.
      let viewportHeight = window.innerHeight;
      let viewportWidth = window.innerWidth;
      let imageNatWidth = GALLERY_IMG.naturalWidth;
      let imageNatHeight = GALLERY_IMG.naturalHeight;
      let imgRatio = imageNatHeight / imageNatWidth
      let newImgHeight = imgRatio * viewportWidth
      GALLERY_IMG.style.marginTop = (viewportHeight / 2) - (newImgHeight / 2) + "px";
      let src = GALLERY_IMG.src.split('?')[0]
      GALLERY_IMG.src = src + "?time=" + new Date();
      loaded = true;
    }
  };

}

function removeNotices() {
  const notices = document.getElementsByClassName("notice");
  while (notices.length > 0)
    notices[0].parentNode.removeChild(notices[0]);
}

/**
 * Handles getting and displaying images in the image gallery.
 * Runs as soon as the list of images is returned.
 **/
window.setInterval(temp => {
  fetchImageList().then(tmp => {
    window.clearInterval();
    removeNotices();
    getNewImage();
    window.setInterval(getNewImage, 10000)
  });
}, 10000);

