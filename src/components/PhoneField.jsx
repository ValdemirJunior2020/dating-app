// src/components/PhoneField.jsx
import React, { useMemo } from "react";

/**
 * Lightweight phone input with a few popular countries.
 * Emits a normalized E.164-ish value like "+15551234567".
 */
const COUNTRIES = [
  { code: "us", name: "United States", dial: "1",  flag: "🇺🇸" },
  { code: "ca", name: "Canada",        dial: "1",  flag: "🇨🇦" },
  { code: "gb", name: "United Kingdom",dial: "44", flag: "🇬🇧" },
  { code: "br", name: "Brazil",        dial: "55", flag: "🇧🇷" },
  { code: "es", name: "Spain",         dial: "34", flag: "🇪🇸" },
  { code: "fr", name: "France",        dial: "33", flag: "🇫🇷" },
  { code: "de", name: "Germany",       dial: "49", flag: "🇩🇪" },
  { code: "it", name: "Italy",         dial: "39", flag: "🇮🇹" },
  { code: "in", name: "India",         dial: "91", flag: "🇮🇳" },
  { code: "mx", name: "Mexico",        dial: "52", flag: "🇲🇽" },
];

function parseValue(val) {
  // "+15551230000" -> { dial:"1", digits:"5551230000" }
  const s = String(val || "").replace(/\s+/g, "");
  const m = s.match(/^\+?(\d{1,3})(\d*)$/);
  if (!m) return { dial: "", digits: "" };
  return { dial: m[1], digits: m[2] || "" };
}

export default function PhoneField({
  value = "",
  onChange = () => {},
  defaultCountry = "us",
  inputProps = {},
}) {
  const { dial: curDial, digits } = useMemo(() => parseValue(value), [value]);

  const current = useMemo(() => {
    if (curDial) {
      const byDial = COUNTRIES.find((c) => c.dial === curDial);
      if (byDial) return byDial;
    }
    return COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0];
  }, [curDial, defaultCountry]);

  function setDial(dial) {
    const clean = String(digits).replace(/\D/g, "");
    onChange(`+${dial}${clean}`);
  }
  function setDigits(raw) {
    const clean = String(raw).replace(/\D/g, "");
    onChange(`+${current.dial}${clean}`);
  }

  return (
    <div className="d-flex" style={{ gap: 8 }}>
      <select
        className="form-select"
        style={{ maxWidth: 170 }}
        value={current.dial}
        onChange={(e) => setDial(e.target.value)}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.flag} +{c.dial} — {c.name}
          </option>
        ))}
      </select>

      <input
        type="tel"
        className="form-control"
        placeholder="Phone number"
        value={digits}
        onChange={(e) => setDigits(e.target.value)}
        {...inputProps}
      />
    </div>
  );
}
