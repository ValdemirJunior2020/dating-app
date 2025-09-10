// src/setupTests.js
import "@testing-library/jest-dom";

const origLog = console.log;
console.log = (...args) => {
  const msg = String(args[0] || "");
  if (
    msg.includes("App Check debug token") ||
    msg.includes("App ID:") ||
    msg.includes("Firebase projectId:")
  ) return;
  origLog(...args);
};
