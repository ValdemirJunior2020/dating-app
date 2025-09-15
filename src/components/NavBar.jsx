// src/components/NavBar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../firebase";
import "./NavBar.css";

function firstNameFrom(user) {
  const dn = user?.displayName || user?.name || "";
  if (dn && dn.trim()) return dn.split(" ")[0];
  const em = user?.email || "";
  return em ? em.split("@")[0] : "You";
}

function initialFrom(user) {
  const s = (user?.displayName || user?.name || user?.email || "U").trim();
  return s ? s[0].toUpperCase() : "U";
}

export default function NavBar() {
  const auth = useAuth() || {};
  const user = auth.currentUser || auth.user || null;

  const logoSrc = "/logo.png";

  return (
    <nav className="navbar navbar-expand-md navbar-light border-bottom">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand brand-cursive d-flex align-items-center" to="/">
          <img src={logoSrc} alt="Candle Love logo" />
          <span>Candle Love</span>
        </Link>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler d-md-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mnav"
          aria-controls="mnav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Desktop nav */}
        <div className="collapse navbar-collapse d-none d-md-block">
          <div className="ms-auto">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">Home</NavLink>
              </li>

              {user ? (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/browse">Browse</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/matches">Matches</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/chat">Chat</NavLink></li>
                  {/* NEW: Profile */}
                  <li className="nav-item"><NavLink className="nav-link" to="/profile">Profile</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/settings">Settings</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/discover">Discover</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/profile/interests">Interests</NavLink></li>

                  {/* User chip + logout */}
                  <li className="nav-item d-flex align-items-center">
                    <div className="user-chip">
                      <Link to="/profile" className="avatar" title={user?.email || ""}>
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="me"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          <span className="initial">{initialFrom(user)}</span>
                        )}
                        <span className="online" />
                      </Link>
                      <div className="user-text d-none d-lg-block">
                        <div className="hello">Hi,</div>
                        <div className="name">{firstNameFrom(user)}</div>
                      </div>
                      <button className="btn btn-sm btn-outline-light border" onClick={logOut}>
                        Log out
                      </button>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/login">Login</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/signup">Sign Up</NavLink></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Mobile offcanvas */}
        <div className="offcanvas offcanvas-end d-md-none" tabIndex="-1" id="mnav" aria-labelledby="mnavLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title brand-cursive d-flex align-items-center" id="mnavLabel">
              <img src={logoSrc} alt="" style={{ height: 28, marginRight: 8 }} />
              Candle Love
            </h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close" />
          </div>

          <div className="offcanvas-body">
            <ul className="navbar-nav align-items-start gap-2">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" data-bs-dismiss="offcanvas">Home</NavLink>
              </li>

              {user ? (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/browse" data-bs-dismiss="offcanvas">Browse</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/matches" data-bs-dismiss="offcanvas">Matches</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/chat" data-bs-dismiss="offcanvas">Chat</NavLink></li>
                  {/* NEW: Profile (mobile) */}
                  <li className="nav-item"><NavLink className="nav-link" to="/profile" data-bs-dismiss="offcanvas">Profile</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/settings" data-bs-dismiss="offcanvas">Settings</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/discover" data-bs-dismiss="offcanvas">Discover</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/profile/interests" data-bs-dismiss="offcanvas">Interests</NavLink></li>

                  <li className="nav-item mt-2">
                    <button className="btn btn-sm btn-outline-light border" onClick={logOut} data-bs-dismiss="offcanvas">
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/login" data-bs-dismiss="offcanvas">Login</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/signup" data-bs-dismiss="offcanvas">Sign Up</NavLink></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
