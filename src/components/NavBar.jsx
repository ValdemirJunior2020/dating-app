// src/components/NavBar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import "./NavBar.css";

export default function NavBar() {
  const { user } = useAuth();
  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");
  const logoSrc = `${process.env.PUBLIC_URL || ""}/logo.png`;

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
      alert("Could not log out. Please try again.");
    }
  }

  return (
    <nav className="navbar navbar-expand-md shadow-sm sticky-top">
      <div className="container">
        {/* Brand (logo + text) */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logoSrc}
            alt="Candle Love logo"
            onError={(e) => (e.currentTarget.style.display = "none")}
            style={{ height: 40, marginRight: 10 }}
          />
          Candle Love
        </Link>

        {/* Toggler (mobile) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mnav"
          aria-controls="mnav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Mobile offcanvas (hidden on md+ to avoid duplicate menus) */}
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
            />
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav ms-auto gap-2">
              <li className="nav-item">
                <NavLink className={linkClass} to="/" data-bs-dismiss="offcanvas">
                  Home
                </NavLink>
              </li>

              {user ? (
                <>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/browse" data-bs-dismiss="offcanvas">
                      Browse
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/matches" data-bs-dismiss="offcanvas">
                      Matches
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/online" data-bs-dismiss="offcanvas">
                      Online
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/chat" data-bs-dismiss="offcanvas">
                      Chat
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/settings" data-bs-dismiss="offcanvas">
                      Settings
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={handleLogout}
                      data-bs-dismiss="offcanvas"
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/login" data-bs-dismiss="offcanvas">
                      Login
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/signup" data-bs-dismiss="offcanvas">
                      Sign Up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Desktop menu (md+) */}
        <div className="d-none d-md-flex ms-auto">
          <ul className="navbar-nav gap-2">
            <li className="nav-item">
              <NavLink className={linkClass} to="/">
                Home
              </NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/browse">
                    Browse
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/matches">
                    Matches
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/online">
                    Online
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/chat">
                    Chat
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/settings">
                    Settings
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/signup">
                    Sign Up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
