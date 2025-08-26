// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";

import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Matches from "./pages/Matches";
import Online from "./pages/Online";
import Chat from "./pages/Chat";              // <— supports :matchId or :otherUid
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import EmailLogin from "./pages/EmailLogin";  // comment out if you don't have it
import ResetPassword from "./pages/ResetPassword"; // comment out if you don't have it

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

        {/* Chat list / placeholder */}
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />

        {/* Chat thread by matchId (same component) */}
        <Route
          path="/chat/:matchId"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />

        {/* ✅ Added: Chat thread by other user's uid (builds matchId in component) */}
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
      </Routes>
    </>
  );
}
