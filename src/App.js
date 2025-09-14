// src/App.js
import React, { useEffect } from "react";
import Profile from "./pages/Profile";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
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
import ResetPassword from "./pages/ResetPassword";
import EduSignUp from "./pages/EduSignUp";
import PublicProfile from "./pages/PublicProfile";
import Discover from "./pages/Discover";
import ProfileInterests from "./pages/ProfileInterests";
import Rewards from "./pages/Rewards";
import Report from "./pages/Report";

// New pages
import Messages from "./pages/Messages";
import Likes from "./pages/Likes";
import Premium from "./pages/Premium"; // ← NEW

// Toaster + daily streak hook
import { ToasterProvider } from "./components/Toaster";
import useLoginStreakEffect from "./hooks/useLoginStreakEffect";

// Presence
import { useAuth } from "./context/AuthContext";
import { pulsePresence, setOnline } from "./services/presence";

/** Runs the streak hook INSIDE ToasterProvider so useToast() has context */
function StreakTicker() {
  useLoginStreakEffect();
  return null;
}

/** Presence: mark online + heartbeat while signed in */
function PresenceTicker() {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!user?.uid) return;

    // go online immediately
    setOnline(true);

    // pulse every 30s
    const iv = setInterval(() => pulsePresence(), 30_000);

    // pulse when tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === "visible") pulsePresence();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.uid]); // depend on uid

  return null;
}

export default function App() {
  return (
    <ToasterProvider>
      <ImageLightboxRoot />
      <NavBar />
      <StreakTicker />
      <PresenceTicker />

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
                <Browse />
              </RequireAuth>
            }
          />
          <Route
            path="/matches"
            element={
              <RequireAuth>
                <Matches />
              </RequireAuth>
            }
          />
          <Route
            path="/online"
            element={
              <RequireAuth>
                <Online />
              </RequireAuth>
            }
          />

          {/* Chat (support multiple param names for safety) */}
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:matchId"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/with/:otherUid"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />

          {/* Inbox & Likes */}
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />
          <Route
            path="/likes"
            element={
              <RequireAuth>
                <Likes />
              </RequireAuth>
            }
          />

          {/* Premium (Upgrade & Portal) */}
          <Route
            path="/premium"
            element={
              <RequireAuth>
                <Premium />
              </RequireAuth>
            }
          />

          {/* Profile editor (NEW) */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />

          {/* Extras */}
          <Route
            path="/discover"
            element={
              <RequireAuth>
                <Discover />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/interests"
            element={
              <RequireAuth>
                <ProfileInterests />
              </RequireAuth>
            }
          />
          <Route
            path="/rewards"
            element={
              <RequireAuth>
                <Rewards />
              </RequireAuth>
            }
          />
          <Route
            path="/report/:uid"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </ToasterProvider>
  );
}
