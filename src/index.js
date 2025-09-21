// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { initBootstrapUserDoc } from "./services/bootstrapUserDoc";

// Global styles + Bootstrap (JS bundle needed for Offcanvas / Navbar toggler)
import "./styles/global.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

/**
 * Hard-unregister any service workers so users don't get a stale cached bundle
 * (which is what causes the `key=YOUR_KEY` issue to persist on some devices).
 */
(function killServiceWorkersAndOldTokens() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});

    // Ask any active SW to stop controlling the page ASAP
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.active && r.active.postMessage({ type: "SKIP_WAITING" })))
      .catch(() => {});

    // Optional: clear old Workbox caches (best-effort)
    if (window.caches && caches.keys) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (/workbox|webpack|runtime|precache/i.test(k)) {
            caches.delete(k);
          }
        });
      });
    }
  }

  // Also clear any leftover App Check debug token in prod
  try {
    localStorage.removeItem("firebase:appCheckDebugToken");
  } catch (_) {}
})();

// Ensure user doc + default emailPrefs exist on first sign-in
initBootstrapUserDoc();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
