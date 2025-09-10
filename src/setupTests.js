import "@testing-library/jest-dom";

// Quiet some noisy logs in tests
const origLog = console.log;
console.log = (...args) => {
  const msg = String(args[0] || "");
  if (msg.includes("App Check debug token") || msg.includes("App ID:")) return;
  origLog(...args);
};
