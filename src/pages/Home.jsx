import React from "react";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <div className="container py-4">
      <div className="p-4 p-md-5 bg-white card-soft">
        <h1 className="h3 h-md1 fw-bold mb-2">Dating App MVP</h1>
        <p className="mb-4">React + Bootstrap + Firebase. Start with a Lean Canvas, then onboard users and test the core loop.</p>
        <div className="d-grid d-md-flex gap-2">
          <Link to="/canvas" className="btn btn-primary btn-mobile-full">Open Lean Canvas</Link>
          <Link to="/onboarding" className="btn btn-outline-secondary btn-mobile-full">Try Onboarding</Link>
        </div>
      </div>
    </div>
  );
}
