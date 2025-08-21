// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import FixPhotos from "./pages/FixPhotos.jsx";
// ...
import NavBar from "./components/NavBar";
import Health from "./pages/Health.jsx";
// ...

// Public pages
import Home from "./pages/Home";
import LeanCanvas from "./pages/LeanCanvas";

// Auth pages
import Login from "./pages/Login";
import EmailLogin from "./pages/EmailLogin.jsx";
import SignUp from "./pages/SignUp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

// Protected pages
import RequireAuth from "./components/RequireAuth";
import Onboarding from "./pages/Onboarding";
import Browse from "./pages/Browse";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings.jsx";

// (Optional) simple 404
function NotFound() {
  return (
    <div className="container py-5">
      <h1 className="h4">Page not found</h1>
      <p className="text-muted">The page you’re looking for doesn’t exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/fix-photos" element={<RequireAuth><FixPhotos /></RequireAuth>} />
        <Route path="/canvas" element={<LeanCanvas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-email" element={<EmailLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/fix-photos" element={<RequireAuth><FixPhotos /></RequireAuth>} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/health" element={<Health />} />

        {/* Protected */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
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
          path="/chat/:matchId"
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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
