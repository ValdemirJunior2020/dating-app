import React, { useState } from "react";

/**
 * EditableText
 * Inline editor with Save/Cancel.
 *
 * Props:
 *  - label: string
 *  - value: string
 *  - placeholder?: string
 *  - multiline?: boolean
 *  - maxLength?: number
 *  - onSave: (newVal: string) => Promise<void> | void
 */
export default function EditableText({
  label,
  value = "",
  placeholder = "",
  multiline = false,
  maxLength = 300,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const start = () => {
    setVal(value || "");
    setErr("");
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setErr("");
  };
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await onSave(val);
      setEditing(false);
    } catch (e) {
      console.error("EditableText save:", e);
      setErr(e?.message || "Save failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <label className="form-label mb-1">{label}</label>
        {!editing && (
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={start}>
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="form-control bg-light" style={{ minHeight: multiline ? 80 : 40 }}>
          {value ? value : <span className="text-muted">{placeholder || "—"}</span>}
        </div>
      ) : (
        <>
          {multiline ? (
            <textarea
              className="form-control"
              rows={4}
              maxLength={maxLength}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <input
              className="form-control"
              type="text"
              maxLength={maxLength}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
            />
          )}

          {err && <div className="text-danger small mt-1">{err}</div>}

          <div className="d-flex gap-2 mt-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-light btn-sm" onClick={cancel} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
