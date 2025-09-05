// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import RequireCollegeVerified from "./components/RequireCollegeVerified";
import RequireAdmin from "./components/RequireAdmin";
import RequireProfilePhoto from "./components/RequireProfilePhoto";

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
import AdminDashboard from "./pages/AdminDashboard";

// ⬅️ Your existing self-only profile page
import Profile from "./pages/Profile";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login-email" element={<EmailLogin />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/edu-signup" element={<EduSignUp />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        {/* Private + college-verified + has at least one photo */}
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
              <RequireCollegeVerified>
                <RequireProfilePhoto>
                  <Matches />
                </RequireProfilePhoto>
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />
        <Route
          path="/online"
          element={
            <RequireAuth>
              <RequireCollegeVerified>
                <RequireProfilePhoto>
                  <Online />
                </RequireProfilePhoto>
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />

        {/* Chat */}
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <RequireCollegeVerified>
                <RequireProfilePhoto>
                  <Chat />
                </RequireProfilePhoto>
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <RequireAuth>
              <RequireCollegeVerified>
                <RequireProfilePhoto>
                  <Chat />
                </RequireProfilePhoto>
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />
        <Route
          path="/chat/with/:otherUid"
          element={
            <RequireAuth>
              <RequireCollegeVerified>
                <RequireProfilePhoto>
                  <Chat />
                </RequireProfilePhoto>
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />

        {/* Settings (private, not gated by college/photo so users can complete profile) */}
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />

        {/* ✅ Self profile (the file you already have) */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* 🧩 Temporary: route /profile/:uid to the same component to avoid 404s.
            It will still show YOUR profile (since the component uses auth.currentUser).
            Next step we’ll add a dedicated public profile page for viewing others. */}
        <Route
          path="/profile/:uid"
          element={
            <RequireAuth>
              <RequireCollegeVerified>
                <Profile />
              </RequireCollegeVerified>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}
