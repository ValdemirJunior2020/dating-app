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
import ResetPassword from "./pages/ResetPassword";
import EduSignUp from "./pages/EduSignUp";
import PublicProfile from "./pages/PublicProfile";

// New pages we added earlier
import Discover from "./pages/Discover";
import ProfileInterests from "./pages/ProfileInterests";

export default function App() {
  return (
    <>
      <ImageLightboxRoot />
      <NavBar />

      {/* 👇 wrapper that adds a little space before page content on all routes */}
      <main className="content-offset">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login-email" element={<EmailLogin />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/edu-signup" element={<EduSignUp />} />

          {/* View a user's public profile (requires sign-in, but not college check) */}
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
            path="/chat/with/:otherUid"
            element={
              <RequireAuth>
                <Chat />
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

          {/* Discover by shared interests */}
          <Route
            path="/discover"
            element={
              <RequireAuth>
                <Discover />
              </RequireAuth>
            }
          />

          {/* Edit interests (separate page) */}
          <Route
            path="/profile/interests"
            element={
              <RequireAuth>
                <ProfileInterests />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </>
  );
}
