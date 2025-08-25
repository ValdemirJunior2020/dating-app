import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../firebase";
import "./NavBar.css";

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-md sticky-top">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/">
          Candle Love
        </Link>

        {/* HAMBURGER (only < md) */}
        <button
          className="navbar-toggler d-inline-flex d-md-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mnav"
          aria-controls="mnav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* DESKTOP MENU (md and up) */}
        <div className="d-none d-md-flex ms-auto">
          <ul className="navbar-nav align-items-center gap-2">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/browse">Browse</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/matches">Matches</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/chat">Chat</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/settings">Settings</NavLink>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light" onClick={logOut}>
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/signup">Sign Up</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* MOBILE OFFCANVAS (only rendered/visible < md) */}
        <div
          className="offcanvas offcanvas-end d-md-none"
          tabIndex="-1"
          id="mnav"
          aria-labelledby="mnavLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mnavLabel">Menu</h5>
            <button
              type="button"
              className="btn-close text-reset"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav ms-auto gap-2">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" data-bs-dismiss="offcanvas">
                  Home
                </NavLink>
              </li>

              {user ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/browse" data-bs-dismiss="offcanvas">Browse</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/matches" data-bs-dismiss="offcanvas">Matches</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/chat" data-bs-dismiss="offcanvas">Chat</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/settings" data-bs-dismiss="offcanvas">Settings</NavLink>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => { logOut(); }}
                      data-bs-dismiss="offcanvas"
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/login" data-bs-dismiss="offcanvas">Login</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/signup" data-bs-dismiss="offcanvas">Sign Up</NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
