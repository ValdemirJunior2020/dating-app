// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import RequireCollegeVerified from "./components/RequireCollegeVerified";
import RequireProfilePhoto from "./components/RequireProfilePhoto";
import ImageLightboxRoot from "./components/ImageLightbox";

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
import ResetPassword from "./pages/ResetPassword"; // ← keep only this ONE import
import EduSignUp from "./pages/EduSignUp";
import PublicProfile from "./pages/PublicProfile";
import Discover from "./pages/Discover";
import ProfileInterests from "./pages/ProfileInterests";
import Rewards from "./pages/Rewards";
import Report from "./pages/Report";

// Toaster + daily streak hook
import { ToasterProvider } from "./components/Toaster";
import useLoginStreakEffect from "./hooks/useLoginStreakEffect";

/** Runs the streak hook INSIDE ToasterProvider so useToast() has context */
function StreakTicker() {
  useLoginStreakEffect();
  return null;
}

export default function App() {
  return (
    <ToasterProvider>
      <ImageLightboxRoot />
      <NavBar />
      <StreakTicker />

      <main className="content-offset">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login-email" element={<EmailLogin />} />
          <Route path="/reset" element={<ResetPassword />} /> {/* ← only once */}
          <Route path="/edu-signup" element={<EduSignUp />} />

          {/* Auth-required public profile */}
          <Route path="/u/:uid" element={<RequireAuth><PublicProfile /></RequireAuth>} />

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

          {/* Extras */}
          <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
          <Route path="/profile/interests" element={<RequireAuth><ProfileInterests /></RequireAuth>} />
          <Route path="/rewards" element={<RequireAuth><Rewards /></RequireAuth>} />
          <Route path="/report/:uid" element={<RequireAuth><Report /></RequireAuth>} />
        </Routes>
      </main>
    </ToasterProvider>
  );
}
