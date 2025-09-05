// Lightweight browser face check using the Shape Detection API (Chromium).
// If unsupported, we return supported:false so the caller can allow the upload.

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = reject;
    img.src = url;
  });
}

export async function detectFaceInFile(file) {
  try {
    if (typeof window === "undefined" || !("FaceDetector" in window)) {
      return { supported: false, hasFace: null };
    }
    const { img, url } = await loadImageFromFile(file);
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    URL.revokeObjectURL(url);
    return { supported: true, hasFace: Array.isArray(faces) && faces.length > 0 };
  } catch (e) {
    return { supported: false, hasFace: null };
  }
}
