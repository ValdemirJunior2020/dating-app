// src/components/Toaster.jsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToasterProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    const toast = {
      id,
      title: opts.title || "",
      desc: opts.desc || "",
      icon: opts.icon || "🏆",
      duration: typeof opts.duration === "number" ? opts.duration : 3600, // ms
    };
    setToasts((t) => [toast, ...t]);
    // auto-dismiss
    setTimeout(() => remove(id), toast.duration);
    return id;
  }, [remove]);

  const api = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToasterViewport toasts={toasts} onClose={remove} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToasterProvider>");
  return ctx;
}

export function ToasterViewport({ toasts, onClose }) {
  return (
    <div style={{
      position: "fixed",
      right: 16,
      top: 16,
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-card"
          style={{
            minWidth: 260,
            maxWidth: 360,
            padding: 12,
            borderRadius: 12,
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 10,
            alignItems: "center",
            background: "linear-gradient(180deg, var(--brown-900, #1a0f07), var(--brown-800, #2a180c))",
            border: "1px solid rgba(230,183,109,0.35)",
            color: "#fff",
            boxShadow: "0 10px 28px rgba(0,0,0,0.45)"
          }}
        >
          <div style={{ fontSize: 22, lineHeight: 1 }}>{t.icon || "🔔"}</div>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontWeight: 800 }}>{t.title}</div>
            {t.desc ? (
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t.desc}</div>
            ) : null}
          </div>
          <button
            onClick={() => onClose(t.id)}
            className="btn btn-sm btn-outline-light border"
            style={{ whiteSpace: "nowrap" }}
            title="Dismiss"
          >
            Close
          </button>
        </div>
      ))}
    </div>
  );
}