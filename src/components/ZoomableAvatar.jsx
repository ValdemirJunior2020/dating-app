import React, { useEffect, useState } from "react";
import AvatarWithBadge from "./AvatarWithBadge";

/**
 * ZoomableAvatar
 * shape: "circle" | "rounded"
 */
export default function ZoomableAvatar({
  src,
  alt = "Profile photo",
  size = 160,
  rounded = 16,
  verified = false,
  badgeSrc = "/Cartola.png",
  badgeSize = 36,
  badgePosition = "tr",
  className = "",
  style = {},
  largeRadius = 16,
  shape = "rounded",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const btnReset = {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "zoom-in",
    display: "inline-block",
    borderRadius: shape === "circle" ? "50%" : rounded,
  };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(2px)",
    zIndex: 1050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "zoom-out",
    padding: 16,
  };
  const largeImg = {
    maxWidth: "92vw",
    maxHeight: "92vh",
    borderRadius: largeRadius,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    objectFit: "contain",
    background: "#000",
  };
  const closeX = {
    position: "fixed",
    top: 12,
    right: 16,
    color: "#fff",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ ...btnReset, ...style }} className={className} aria-label="Enlarge photo">
        <AvatarWithBadge
          src={src}
          alt={alt}
          size={size}
          rounded={rounded}
          verified={verified}
          badgeSrc={badgeSrc}
          badgeSize={badgeSize}
          badgePosition={badgePosition}
          shape={shape}
        />
      </button>

      {open && (
        <div style={overlay} onClick={() => setOpen(false)} aria-modal="true" role="dialog">
          <span style={closeX} aria-hidden>&times;</span>
          <img
            src={src}
            alt={alt}
            style={largeImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
