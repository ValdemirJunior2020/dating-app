import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../firebase";
import "./NavBar.css";

function firstNameFrom(user) {
  const dn = user?.displayName || user?.name || "";
  if (dn.trim()) return dn.split(" ")[0];
  const em = user?.email || "";
  return em ? em.split("@")[0] : "You";
}

function initialFrom(user) {
  const s = (user?.displayName || user?.name || user?.email || "U").trim();
  return s ? s[0].toUpperCase() : "U";
}

export default function NavBar() {
  const { user } = useAuth();
  const first = firstNameFrom(user);
  const initial = initialFrom(user);

  return (
    <nav className="navbar navbar-expand-md sticky-top">
      <div className="container">
        {/* Brand: logo + name */}
        <Link className="navbar-brand fw-bold" to="/">
          <img src="/logo.png" alt="Candle Love logo" height="40" className="me-2" />
          <span className="brand-cursive">Candle Love</span>

        </Link>

        {/* Hamburger (mobile) */}
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

        {/* Desktop menu */}
        <div className="d-none d-md-flex ms-auto align-items-center gap-3">
          {user && (
            <div className="user-chip" title="You're logged in">
              <div className="avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" />
                ) : (
                  <span className="initial">{initial}</span>
                )}
                <span className="online" />
              </div>
              <div className="user-text">
                <span className="hello">Hi,</span>{" "}
                <span className="name">{first}</span>
              </div>
            </div>
          )}

          <ul className="navbar-nav align-items-center gap-2">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/browse">Browse</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="/matches">Matches</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="/chat">Chat</NavLink></li>
                <li className="nav-item"><NavLink className="nav-link" to="/settings">Settings</NavLink></li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light" onClick={logOut}>Log out</button>
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

        {/* Mobile offcanvas */}
        <div className="offcanvas offcanvas-end d-md-none" tabIndex="-1" id="mnav" aria-labelledby="mnavLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title brand-cursive" id="mnavLabel">Candle Love</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>

          <div className="offcanvas-body">
            {user && (
              <div className="mb-3">
                <div className="user-chip w-100 justify-content-start">
                  <div className="avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" />
                    ) : (
                      <span className="initial">{initial}</span>
                    )}
                    <span className="online" />
                  </div>
                  <div className="user-text">
                    <span className="hello">Hi,</span>{" "}
                    <span className="name">{first}</span>
                  </div>
                </div>
              </div>
            )}

            <ul className="navbar-nav ms-auto gap-2">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" data-bs-dismiss="offcanvas">Home</NavLink>
              </li>

              {user ? (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/browse" data-bs-dismiss="offcanvas">Browse</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/matches" data-bs-dismiss="offcanvas">Matches</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/chat" data-bs-dismiss="offcanvas">Chat</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/settings" data-bs-dismiss="offcanvas">Settings</NavLink></li>
                  <li className="nav-item">
                    <button className="btn btn-sm btn-outline-light" onClick={logOut} data-bs-dismiss="offcanvas">Log out</button>
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
