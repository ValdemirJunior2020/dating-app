// public/seasonal-bg.js
(function () {
  try {
    // Thanksgiving only (you can extend this map later for other seasons)
    var base = '/images/thanks_giving_bg.png';
    var base2x = '/images/thanks_giving_bg@2x.png';
    var base3x = '/images/thanks_giving_bg@3x.png';

    // Build a retina-aware image-set; browsers pick the best one
    var imageSet = "image-set(url('" + base + "') 1x, url('" + base2x + "') 2x, url('" + base3x + "') 3x)";

    function applyBg(el) {
      if (!el) return;

      // Fallback first (older browsers)
      el.style.backgroundImage = "url('" + base + "')";
      // Hi-DPI (overwrites if supported)
      el.style.backgroundImage = imageSet;

      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundColor = '#522703';

      // Mobile: avoid iOS/Android downscaling blur from background-attachment: fixed
      var isMobile = window.innerWidth < 768;
      el.style.backgroundAttachment = isMobile ? 'scroll' : 'fixed';
    }

    var body = document.body;
    var root = document.getElementById('root');
    applyBg(body);
    applyBg(root);

    // Re-evaluate attachment on resize (mobile vs desktop)
    window.addEventListener('resize', function () {
      applyBg(body);
      applyBg(root);
    });

    console.log('[CandleLove] Seasonal BG hi-dpi applied');
  } catch (e) {
    console.warn('seasonal bg failed', e);
  }
})();
