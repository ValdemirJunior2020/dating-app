// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import LeanCanvas from "./pages/LeanCanvas";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import RequireAuth from "./components/RequireAuth";
import Browse from "./pages/Browse";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import EmailLogin from "./pages/EmailLogin";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/canvas" element={<LeanCanvas />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-email" element={<EmailLogin />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset" element={<ResetPassword />} />

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
      </Routes>
    </>
  );
}
