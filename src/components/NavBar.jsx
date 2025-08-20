// src/components/NavBar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../firebase";

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar navbar-expand-md bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">CupidMVP</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mnav">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Offcanvas (mobile) */}
        <div className="offcanvas offcanvas-end" tabIndex="-1" id="mnav">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menu</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/browse" className="nav-link">Browse</NavLink></li>
              <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/matches" className="nav-link">Matches</NavLink></li>
              <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/canvas" className="nav-link">Lean Canvas</NavLink></li>
              <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/onboarding" className="nav-link">Onboarding</NavLink></li>
              {user && (
                <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/settings" className="nav-link">Settings</NavLink></li>
              )}
              {!user ? (
                <li className="nav-item" data-bs-dismiss="offcanvas"><NavLink to="/login" className="nav-link">Sign in</NavLink></li>
              ) : (
                <li className="nav-item">
                  <button className="btn btn-outline-danger mt-2 mt-md-0" onClick={logOut}>Sign out</button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Desktop (md+) */}
        <div className="collapse navbar-collapse d-none d-md-block">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><NavLink to="/browse" className="nav-link">Browse</NavLink></li>
            <li className="nav-item"><NavLink to="/matches" className="nav-link">Matches</NavLink></li>
            <li className="nav-item"><NavLink to="/canvas" className="nav-link">Lean Canvas</NavLink></li>
            <li className="nav-item"><NavLink to="/onboarding" className="nav-link">Onboarding</NavLink></li>
            {user && <li className="nav-item"><NavLink to="/settings" className="nav-link">Settings</NavLink></li>}
            {!user ? (
              <li className="nav-item"><NavLink to="/login" className="nav-link">Sign in</NavLink></li>
            ) : (
              <>
                {user.photoURL ? <li className="nav-item"><img src={user.photoURL} alt="" className="avatar me-2" /></li> : null}
                <li className="nav-item"><span className="nav-link text-muted">{user.displayName || user.email}</span></li>
                <li className="nav-item"><button className="btn btn-outline-danger ms-2" onClick={logOut}>Sign out</button></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
