// src/components/ZoomableAvatar.jsx
import React from "react";

/**
 * Circular avatar that opens a lightbox when clicked (parent controls).
 * Props:
 *  - src: string (image URL)
 *  - size: number (px)
 *  - onClick: () => void
 *  - verified: boolean (adds the Cartola badge)
 */
export default function ZoomableAvatar({ src, size = 96, onClick, verified }) {
  const fallback = "/logo.png"; // ✅ use existing asset
  const url = src || fallback;

  return (
    <div
      role="button"
      onClick={onClick}
      className="position-relative"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.6)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        cursor: "zoom-in",
        backgroundColor: "#111",
        display: "inline-block",
      }}
      title="Click to view"
    >
      <img
        src={url}
        alt="Profile"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        onError={(e) => {
          if (e.currentTarget.src !== window.location.origin + fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />

      {verified && (
        <img
          src="/Cartola.png"
          alt="Verified"
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            width: Math.round(size * 0.35),
            height: Math.round(size * 0.35),
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}
