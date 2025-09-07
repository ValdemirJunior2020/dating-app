// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// src/index.js
import "./styles/global.css";


import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { initBootstrapUserDoc } from "./services/bootstrapUserDoc";

// Global styles + Bootstrap (JS bundle needed for Offcanvas / Navbar toggler)
import "./styles/global.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// src/index.js (or src/App.js – either is fine)



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
