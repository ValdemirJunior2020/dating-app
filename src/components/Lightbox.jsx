// src/components/Lightbox.jsx
import React, { useEffect } from "react";

export default function Lightbox({ photos = [], start = 0, onClose }) {
  const [i, setI] = React.useState(start);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((k) => (k + 1) % photos.length);
      if (e.key === "ArrowLeft") setI((k) => (k - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  if (!photos.length) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,.9)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div className="h-100 d-flex align-items-center justify-content-center">
        <img
          src={photos[i]}
          alt=""
          style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Controls */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3"
            onClick={(e) => { e.stopPropagation(); setI((k) => (k - 1 + photos.length) % photos.length); }}
          >
            ‹
          </button>
          <button
            type="button"
            className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3"
            onClick={(e) => { e.stopPropagation(); setI((k) => (k + 1) % photos.length); }}
          >
            ›
          </button>
        </>
      )}
      <button
        type="button"
        className="btn btn-outline-light position-absolute top-0 end-0 m-3"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}
