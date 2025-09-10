// src/components/ImageLightbox.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const Ctx = createContext({ open: () => {}, close: () => {} });

export function useLightbox() {
  return useContext(Ctx);
}

/**
 * Provider + overlay. Put this HIGH in your tree and wrap the app with it.
 * Use in two ways:
 *  1) Imperative: const { open } = useLightbox(); open(url)
 *  2) Attribute:  <img src={...} data-enlarge />
 */
export default function ImageLightboxRoot({ children }) {
  const [src, setSrc] = useState(null);
  const open = useCallback((s) => setSrc(s || null), []);
  const close = useCallback(() => setSrc(null), []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (src) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, close]);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {src && (
        <div className="lightbox-overlay" onClick={close} role="button">
          <img
            src={src}
            alt=""
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-x" onClick={close} aria-label="Close">
            ×
          </button>
          <style>{`
            .lightbox-overlay{
              position:fixed; inset:0; background:rgba(0,0,0,.92);
              display:flex; align-items:center; justify-content:center;
              z-index:3000; padding:16px;
            }
            .lightbox-img{
              max-width:96vw; max-height:90vh; border-radius:12px;
              box-shadow:0 14px 28px rgba(0,0,0,.6);
            }
            .lightbox-x{
              position:fixed; top:8px; right:12px; font-size:34px; line-height:1;
              color:#fff; background:transparent; border:0; cursor:pointer;
            }
          `}</style>
        </div>
      )}
    </Ctx.Provider>
  );
}
