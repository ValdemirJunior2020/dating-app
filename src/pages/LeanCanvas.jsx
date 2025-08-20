import React, { useState } from "react";
import CanvasCard from "../components/CanvasCard";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { askGemini } from "../services/gemini";

const FIELDS = [
  "Problem","Solution","Unique Value Proposition","Unfair Advantage","Customer Segments",
  "Existing Alternatives","Key Metrics","High Level Concept",
  "Channels","Early Adopters","Cost Structure","Revenue Streams"
];

export default function LeanCanvas(){
  const [data, setData] = useState(Object.fromEntries(FIELDS.map(f => [f, ""])));
  const [saving, setSaving] = useState(false);
  const [aiHelp, setAiHelp] = useState("");

  const setField = (k) => (v) => setData(prev => ({ ...prev, [k]: v }));

  async function saveCanvas(){
    setSaving(true);
    const id = uuid();
    await setDoc(doc(db, "lean_canvas", id), { id, ...data, createdAt: Date.now() });
    setSaving(false);
    alert("Saved!");
  }

  async function aiSuggest(){
    const prompt = `
Act as a startup mentor. Given a dating app idea, suggest concise bullets for:
${FIELDS.join(", ")}.
Current notes: ${JSON.stringify(data)}
`.trim();
    const text = await askGemini(prompt);
    setAiHelp(text);
  }

  return (
    <div className="container py-4">
      <h2 className="mb-3">Lean Canvas</h2>
      <div className="row">
        {FIELDS.map((f) => (
          <CanvasCard
            key={f}
            title={f}
            value={data[f]}
            setValue={(v) => setField(f)(v)}
            placeholder={`Enter ${f.toLowerCase()}...`}
          />
        ))}
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={saveCanvas} disabled={saving}>
          {saving ? "Saving..." : "Save to Firestore"}
        </button>
        <button className="btn btn-outline-secondary" onClick={aiSuggest}>
          AI Suggest (optional)
        </button>
      </div>

      {aiHelp && (
        <div className="alert alert-light mt-3" style={{ whiteSpace: "pre-wrap" }}>
          {aiHelp}
        </div>
      )}
    </div>
  );
}
