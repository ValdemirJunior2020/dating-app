// src/components/NavBar.jsx
import React from "react";
import "./NavBar.css"; // ✅ use your navbar theme
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";

const logoSrc = process.env.PUBLIC_URL + "/logo.png";
const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logoSrc} alt="Candle Love logo" height={40} className="me-2" />
          <span className="brand-cursive">Candle Love</span>
        </Link>

        {/* Hamburger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Collapsible area */}
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
            </li>

            {user && (
              <>
                <li className="nav-item">
                  <NavLink to="/browse" className={linkClass}>
                    Browse
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/matches" className={linkClass}>
                    Matches
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/online" className={linkClass}>
                    Online
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/chat" className={linkClass}>
                    Chat
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/settings" className={linkClass}>
                    Settings
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex gap-2">
            {!user ? (
              <>
                <Link to="/login" className="btn btn-outline-light">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            ) : (
              <button className="btn btn-outline-danger" onClick={() => auth.signOut()}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
