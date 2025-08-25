// src/utils/cleanPhotos.js

// Keep only valid Firebase download URLs (or any non-empty http/https images)
export function cleanPhotos(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a.filter(
    (u) =>
      typeof u === "string" &&
      u.trim() &&
      (u.startsWith("http://") || u.startsWith("https://"))
  );
}

// Export both named and default so either import style works:
// import cleanPhotos from '../utils/cleanPhotos'
// or
// import { cleanPhotos } from '../utils/cleanPhotos'
export default cleanPhotos;
