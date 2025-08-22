// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";

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
import Profile from "./pages/Profile";


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
        <Route path="/canvas" element={<LeanCanvas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-email" element={<EmailLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Protected */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/:uid"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
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
