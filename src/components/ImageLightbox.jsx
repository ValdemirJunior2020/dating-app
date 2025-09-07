// src/components/ImageLightbox.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ImageLightboxRoot() {
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState({ src: "", alt: "" });

  useEffect(() => {
    const onOpen = (e) => {
      const { src, alt } = e.detail || {};
      if (src) { setImg({ src, alt: alt || "" }); setOpen(true); }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("cl:open", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("cl:open", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: 16
      }}
    >
      <img
        src={img.src}
        alt={img.alt}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}
      />
    </div>,
    document.body
  );
}
