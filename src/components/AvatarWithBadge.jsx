import React from "react";

/**
 * AvatarWithBadge
 * shape: "circle" | "rounded"
 */
export default function AvatarWithBadge({
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
  shape = "rounded",
}) {
  const pos = {
    tr: { top: 6, right: 6 },
    tl: { top: 6, left: 6 },
    br: { bottom: 6, right: 6 },
    bl: { bottom: 6, left: 6 },
  }[badgePosition] || { top: 6, right: 6 };

  const radius = shape === "circle" ? "50%" : rounded;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        background: "#111",
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {verified && (
        <img
          src={badgeSrc}
          alt="College verified"
          title="College verified (.edu)"
          style={{
            position: "absolute",
            width: badgeSize,
            height: badgeSize,
            ...pos,
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.45))",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
