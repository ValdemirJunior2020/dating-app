/* Candle Love — seasonal full-page background (forced)
   Puts a full-bleed image on <body> with an overlay, using !important
   and makes #root transparent so the image is visible behind your UI.
   Images are served from /public/images
*/

(function () {
  var BASE_COLOR = "#522703";                  // your brand brown
  var OVERLAY = "rgba(0,0,0,.28)";             // readability overlay
  var FALLBACK = "/images/thanks_giving_bg.png"; // guaranteed file you have

  // Pick seasonal image by month (0=Jan). Only Nov is required in your repo.
  var seasonal = {
    0: "/images/winter_bg.png",
    1: "/images/winter_bg.png",
    2: "/images/spring_bg.png",
    3: "/images/spring_bg.png",
    4: "/images/spring_bg.png",
    5: "/images/summer_bg.png",
    6: "/images/summer_bg.png",
    7: "/images/summer_bg.png",
    8: "/images/fall_bg.png",
    9: "/images/fall_bg.png",
    10: "/images/thanks_giving_bg.png", // ✅ you have this
    11: "/images/winter_bg.png"
  };

  var month = new Date().getMonth();
  var chosen = seasonal[month] || FALLBACK;

  // Optional manual override for quick testing:
  // ?theme=thanks|winter|spring|summer|fall
  try {
    var q = new URLSearchParams(location.search);
    var t = (q.get("theme") || "").toLowerCase();
    if (t === "thanks") chosen = "/images/thanks_giving_bg.png";
    else if (t === "winter") chosen = "/images/winter_bg.png";
    else if (t === "spring") chosen = "/images/spring_bg.png";
    else if (t === "summer") chosen = "/images/summer_bg.png";
    else if (t === "fall") chosen = "/images/fall_bg.png";
  } catch (e) {}

  function forceBodyBackground(url) {
    var docEl = document.documentElement;
    var body = document.body;
    var root = document.getElementById("root");

    // Ensure containers don’t cover the body image
    if (root) root.style.setProperty("background", "transparent", "important");
    docEl.style.setProperty("background", "transparent", "important");

    // Apply the background with !important so it wins over any CSS
    body.style.setProperty("background-color", BASE_COLOR, "important");
    body.style.setProperty(
      "background-image",
      "linear-gradient(" + OVERLAY + "," + OVERLAY + "), url('" + url + "')",
      "important"
    );
    body.style.setProperty("background-size", "cover", "important");
    body.style.setProperty("background-position", "center center", "important");
    body.style.setProperty("background-repeat", "no-repeat", "important");
    body.style.setProperty("min-height", "100vh", "important");

    // Fixed background only on desktop (prevents mobile scroll jank)
    try {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        body.style.setProperty("background-attachment", "fixed", "important");
      } else {
        body.style.removeProperty("background-attachment");
      }
    } catch (e) {}

    // Small global rule to neuter common page wrappers if they set solids
    var style = document.createElement("style");
    style.textContent =
      "html,body,#root{background:transparent!important;}" +
      ".settings-page,.auth-page,.page,.app,.container-fluid{background:transparent!important;}";
    document.head.appendChild(style);

    // Debug so we can verify quickly
    window.__bg = { chosen: url };
    console.log("[CandleLove] Seasonal BG:", url);
  }

  function setImage(url) {
    var img = new Image();
    img.onload = function () { forceBodyBackground(url); };
    img.onerror = function () { forceBodyBackground(FALLBACK); };
    img.src = url;
  }

  function run() {
    setImage(chosen);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
