// public/seasonal-bg.js
(function () {
  // Path to your seasonal image in /public
  var IMG_URL = "/images/thanks_giving_bg.png";

  // Move the image UP by setting a NEGATIVE pixel offset (try -60 to -140)
  var BG_Y_OFFSET = -90; // px

  function apply() {
    document.documentElement.style.minHeight = "100%";
    document.body.style.minHeight = "100vh";

    document.body.style.backgroundImage = "url('" + IMG_URL + "')";
    document.body.style.backgroundRepeat = "no-repeat";
    // center on X, shift up on Y by N pixels
    document.body.style.backgroundPosition = "center " + BG_Y_OFFSET + "px";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
