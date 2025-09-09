// public/seasonal-bg.js
(function () {
  // ---- BACKGROUNDS ----
  // Default = solid Amber color on all pages
  var BASE_AMBER = "#ff9e2c"; // same as your --amber

  var THEMES = {
    base: "COLOR",                               // solid color (Amber)
    thanksgiving: "/images/thanks_giving_bg.png",
    christmas: "/images/christmas.PNG"
  };

  // Background vertical offset for image themes (negative = move up)
  var BG_Y_OFFSET = -90;

  // ---- CHRISTMAS: NAVBAR-ONLY SNOW OVERLAY ----
  var SNOW_MAX = 40, SNOW_SPEED_MIN = 20, SNOW_SPEED_MAX = 60, SNOW_SIZE_MIN = 1.2, SNOW_SIZE_MAX = 2.6, SNOW_ALPHA_MIN = 0.35, SNOW_ALPHA_MAX = 0.85;

  // ---------- DATE HELPERS ----------
  function atMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function inWindow(day, start, end) { return day >= start && day <= end; }

  // 4th Thursday of November (US Thanksgiving)
  function thanksgivingDate(year) {
    var d = new Date(year, 10, 1); // Nov 1
    var dow = d.getDay();          // 0=Sun..6=Sat
    var firstThu = 1 + ((4 - dow + 7) % 7); // 4=Thu
    return new Date(year, 10, firstThu + 21); // +3 weeks => 4th Thu
  }
  function christmasDate(year) {
    return new Date(year, 11, 25); // Dec 25
  }

  // Pick theme with 5-day windows before/after events
  function pickThemeByDate() {
    // Manual override (for testing): localStorage.setItem('bg_theme','base'|'thanksgiving'|'christmas')
    var forced = localStorage.getItem("bg_theme");
    if (forced && (forced in THEMES)) return forced;

    var today = atMidnight(new Date());
    var y = today.getFullYear();

    var tg = atMidnight(thanksgivingDate(y));
    var tgStart = addDays(tg, -5), tgEnd = addDays(tg, +5);

    var xmas = atMidnight(christmasDate(y));
    var xStart = addDays(xmas, -5), xEnd = addDays(xmas, +5);

    if (inWindow(today, xStart, xEnd)) return "christmas";
    if (inWindow(today, tgStart, tgEnd)) return "thanksgiving";
    return "base"; // default = solid Amber
  }

  // ---------- BACKGROUND APPLY ----------
  function applyBackground(themeKey) {
    // Ensure page fills viewport
    document.documentElement.style.minHeight = "100%";
    document.body.style.minHeight = "100vh";

    if (themeKey === "base" || THEMES[themeKey] === "COLOR") {
      // Solid Amber everywhere
      document.body.style.backgroundColor = BASE_AMBER;
      // Clear any previous image props
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "center top";
      document.body.style.backgroundSize = "auto";
      document.body.style.backgroundAttachment = "scroll";
      return;
    }

    // Image themes (Thanksgiving / Christmas)
    var url = THEMES[themeKey];
    document.body.style.backgroundColor = ""; // let the image show cleanly
    document.body.style.backgroundImage = "url('" + url + "')";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center " + BG_Y_OFFSET + "px";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
  }

  // ---------- CHRISTMAS NAVBAR SNOW ----------
  var snowRAF = null, snowState = null; // { ctx, el, parent, flakes, lastT, w, h }
  function createSnowFlakes(w, h, count) {
    function rnd(a, b) { return a + Math.random() * (b - a); }
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rnd(SNOW_SIZE_MIN, SNOW_SIZE_MAX),
        a: rnd(SNOW_ALPHA_MIN, SNOW_ALPHA_MAX),
        v: rnd(SNOW_SPEED_MIN, SNOW_SPEED_MAX),
        drift: rnd(-20, 20)
      });
    }
    return arr;
  }
  function sizeCanvasTo(el, canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = el.getBoundingClientRect();
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    return { w: canvas.width, h: canvas.height, dpr: dpr };
  }
  function startNavSnow() {
    var nav = document.querySelector(".navbar");
    if (!nav) { setTimeout(startNavSnow, 200); return; }
    if (document.getElementById("__navSnow")) return;

    var canvas = document.createElement("canvas");
    canvas.id = "__navSnow";
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2"; // above navbar background
    if (!nav.style.position) nav.style.position = "sticky";
    nav.appendChild(canvas);

    var dim = sizeCanvasTo(nav, canvas);
    var ctx = canvas.getContext("2d");
    ctx.scale(dim.dpr, dim.dpr);

    var rect = nav.getBoundingClientRect();
    var flakes = createSnowFlakes(rect.width, rect.height, SNOW_MAX);

    snowState = { ctx: ctx, el: canvas, parent: nav, flakes: flakes, lastT: performance.now(), w: rect.width, h: rect.height };
    function step(t) {
      if (!snowState) return;
      var dt = Math.min(0.05, (t - snowState.lastT) / 1000);
      snowState.lastT = t;

      var newRect = snowState.parent.getBoundingClientRect();
      if (Math.abs(newRect.width - snowState.w) > 1 || Math.abs(newRect.height - snowState.h) > 1) {
        var d = sizeCanvasTo(snowState.parent, snowState.el);
        snowState.ctx.setTransform(1,0,0,1,0,0);
        snowState.ctx.scale(d.dpr, d.dpr);
        snowState.w = newRect.width;
        snowState.h = newRect.height;
        snowState.flakes = createSnowFlakes(snowState.w, snowState.h, SNOW_MAX);
      }

      var c = snowState.ctx;
      c.clearRect(0, 0, snowState.w, snowState.h);
      c.save();
      for (var i = 0; i < snowState.flakes.length; i++) {
        var f = snowState.flakes[i];
        f.y += f.v * dt * 0.8;
        f.x += f.drift * dt * 0.3;
        if (f.y - f.r > snowState.h) { f.y = -f.r; f.x = Math.random() * snowState.w; }
        if (f.x < -10) f.x = snowState.w + 10;
        if (f.x > snowState.w + 10) f.x = -10;

        c.globalAlpha = f.a;
        c.beginPath();
        c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        c.fillStyle = "#fff";
        c.fill();
      }
      c.restore();

      snowRAF = requestAnimationFrame(step);
    }
    snowRAF = requestAnimationFrame(step);
  }
  function stopNavSnow() {
    if (snowRAF) cancelAnimationFrame(snowRAF);
    snowRAF = null;
    if (snowState && snowState.el && snowState.el.parentNode) {
      snowState.el.parentNode.removeChild(snowState.el);
    }
    snowState = null;
  }

  // ---------- APPLY THEME ----------
  function applyTheme(themeKey) {
    applyBackground(themeKey);

    // Christmas: navbar snow; otherwise off
    if (themeKey === "christmas") startNavSnow(); else stopNavSnow();
  }

  // ---------- INIT ----------
  function init() {
    var key = pickThemeByDate();
    applyTheme(key);

    // Console helpers for testing:
    //   __seasonalBG.set('base'|'thanksgiving'|'christmas')
    //   __seasonalBG.clear()
    //   __seasonalBG.snow.on() / .off()   (force snow on/off)
    window.__seasonalBG = {
      set: function (k) {
        if (k in THEMES) { localStorage.setItem("bg_theme", k); applyTheme(k); }
      },
      clear: function () {
        localStorage.removeItem("bg_theme");
        applyTheme(pickThemeByDate());
      },
      snow: { on: startNavSnow, off: stopNavSnow }
    };

    window.addEventListener("resize", function () {
      if (snowState) snowState.lastT = performance.now();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
