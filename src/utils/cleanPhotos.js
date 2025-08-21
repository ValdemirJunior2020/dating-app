// src/utils/cleanPhotos.js
export const cleanPhotos = (arr) =>
  (Array.isArray(arr) ? arr : []).filter(
    (u) => typeof u === "string" && u.includes("alt=media")
  );