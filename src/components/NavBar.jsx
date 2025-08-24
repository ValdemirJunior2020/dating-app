// src/components/NavBar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../firebase";
import "./NavBar.css";

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-md shadow-sm sticky-top">
      <div className="container">
        {/* Brand with Logo + Name */}
        <Link className="navbar-brand" to="/">
          <img src="/logo.png" alt="Candle Love Logo" />
          Candle Love
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mnav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Offcanvas (mobile menu) */}
        <div className="offcanvas offcanvas-end" tabIndex="-1" id="mnav">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menu</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/browse">
                  Browse
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/matches">
                  Matches
                </NavLink>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/settings">
                      Settings
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-outline-danger ms-2"
                      onClick={logOut}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <NavLink className="btn btn-outline-light ms-2" to="/login">
                    Login
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
