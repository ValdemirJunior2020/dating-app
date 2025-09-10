// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import RequireCollegeVerified from "./components/RequireCollegeVerified";
import RequireProfilePhoto from "./components/RequireProfilePhoto";
import ImageLightboxRoot, { useLightbox } from "./components/ImageLightbox";

// Pages
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Matches from "./pages/Matches";
import Online from "./pages/Online";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import EmailLogin from "./pages/EmailLogin";
import ResetPassword from "./pages/ResetPassword";
import EduSignUp from "./pages/EduSignUp";
import PublicProfile from "./pages/PublicProfile";
import Discover from "./pages/Discover";
import ProfileInterests from "./pages/ProfileInterests";
import Rewards from "./pages/Rewards";
import Report from "./pages/Report";

// Toaster + daily streak hook
import { ToasterProvider } from "./components/Toaster";
import useLoginStreakEffect from "./hooks/useLoginStreakEffect";

/** Run the streak hook INSIDE ToasterProvider so useToast() has context */
function StreakTicker() {
  useLoginStreakEffect();
  return null;
}

/** Global binder: any <img data-enlarge> will open the lightbox */
function GlobalLightboxBinder() {
  const { open } = useLightbox();

  React.useEffect(() => {
    function onClick(e) {
      const el = e.target.closest("[data-enlarge]");
      if (!el) return;
      const url = el.getAttribute("data-enlarge") || el.getAttribute("src");
      if (url) open(url);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return null;
}

export default function App() {
  return (
    <ToasterProvider>
      {/* wrap EVERYTHING with the lightbox provider */}
      <ImageLightboxRoot>
        <NavBar />
        <StreakTicker />
        <GlobalLightboxBinder />

        <main className="content-offset">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login-email" element={<EmailLogin />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/edu-signup" element={<EduSignUp />} />

            {/* Auth-required public profile */}
            <Route
              path="/u/:uid"
              element={
                <RequireAuth>
                  <PublicProfile />
                </RequireAuth>
              }
            />

            {/* Private */}
            <Route
              path="/browse"
              element={
                <RequireAuth>
                  <RequireCollegeVerified>
                    <RequireProfilePhoto>
                      <Browse />
                    </RequireProfilePhoto>
                  </RequireCollegeVerified>
                </RequireAuth>
              }
            />
            <Route path="/matches" element={<RequireAuth><Matches /></RequireAuth>} />
            <Route path="/online"  element={<RequireAuth><Online /></RequireAuth>} />
            <Route path="/chat"    element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/chat/:matchId" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/chat/with/:otherUid" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

            {/* Discover + Interests + Rewards + Report */}
            <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
            <Route path="/profile/interests" element={<RequireAuth><ProfileInterests /></RequireAuth>} />
            <Route path="/rewards" element={<RequireAuth><Rewards /></RequireAuth>} />
            <Route path="/report/:uid" element={<RequireAuth><Report /></RequireAuth>} />
          </Routes>
        </main>
      </ImageLightboxRoot>
    </ToasterProvider>
  );
}
