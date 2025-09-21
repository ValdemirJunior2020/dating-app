// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { initBootstrapUserDoc } from "./services/bootstrapUserDoc";

import "./styles/global.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Kill any existing service workers & caches so users don’t get stale bundles
(function killSW() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (window.caches && caches.keys) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (/workbox|webpack|runtime|precache|offline/i.test(k)) caches.delete(k);
        });
      });
    }
  }
  try { localStorage.removeItem("firebase:appCheckDebugToken"); } catch (_) {}
})();

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
