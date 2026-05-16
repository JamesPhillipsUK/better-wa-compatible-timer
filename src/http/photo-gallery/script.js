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
                               {method: "GET",
                                headers: {"Accept": "application/json"}}
                              );
  const data = await response.json();
  data.images.forEach(image => {
    imageArray.push(image);
  });
}

function getNewImage(){
  if (currentImageIndex == imageArray.length - 1)
    currentImageIndex = 0;
  else
    currentImageIndex++;
  GALLERY_IMG.src = "./img/" + imageArray[currentImageIndex];
  GALLERY_IMG.alt = imageArray[currentImageIndex];
  GALLERY_IMG.onload = function(){
    // Centres the image vertically and forces reload.
    let viewportHeight = window.innerHeight;
    let viewportWidth = window.innerWidth;
    let imageNatWidth = GALLERY_IMG.naturalWidth;
    let imageNatHeight = GALLERY_IMG.naturalHeight;
    let imgRatio = imageNatHeight / imageNatWidth
    let newImgHeight = imgRatio * viewportWidth
    GALLERY_IMG.style.marginTop = (viewportHeight / 2) - (newImgHeight / 2) + "px";
    GALLERY_IMG.src = GALLERY_IMG.src + "?time=" + new Date();
  };

}

window.setInterval(getNewImage, 10000)

fetchImageList().then(tmp => {
  imageArray.forEach(image => {
    console.log(image);
  });
});
