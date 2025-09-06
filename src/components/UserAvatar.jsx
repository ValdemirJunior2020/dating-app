// src/components/UserAvatar.jsx
import React from "react";
import CircleImage from "./CircleImage";
import VerifiedBadge from "./VerifiedBadge";
import { openLightbox } from "./ImageLightbox";
import cleanPhotos from "../utils/cleanPhotos";

/**
 * Drop-in avatar with:
 *  - Perfect circle crop
 *  - Click to enlarge (lightbox)
 *  - Verified college badge overlay (if user looks "edu-verified")
 *
 * Props:
 *   user   Firestore user doc (must have photos: [] etc.)
 *   size   diameter in px (default 120)
 */
export default function UserAvatar({ user, size = 120 }) {
  const photos = cleanPhotos(user?.photos || []);
  const src = photos[0]?.url || "/placeholder-avatar.png";

  // Heuristics to show the edu badge no matter which field you used
  const isEdu =
    user?.eduVerified ||
    user?.isCollege ||
    user?.collegeVerified ||
    user?.type === "edu" ||
    (Array.isArray(user?.badges) && user.badges.includes("edu"));

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <CircleImage
        src={src}
        alt={user?.displayName || user?.name || "avatar"}
        size={size}
        // open the original photo in the lightbox
        onClick={() => src && openLightbox(src, user?.displayName || "")}
      />
      {isEdu && <VerifiedBadge size={Math.max(22, Math.floor(size / 5))} />}
    </div>
  );
}
