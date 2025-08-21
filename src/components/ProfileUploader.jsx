// src/components/ProfileUploader.jsx
import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db, auth } from "../firebase";

export default function ProfileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uid = auth.currentUser?.uid;

  const handleUpload = async () => {
    if (!file || !uid) return;
    setUploading(true);

    try {
      const fileRef = ref(storage, `profiles/${uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      // Save photo URL into Firestore user doc
      await updateDoc(doc(db, "users", uid), { photoURL: url });

      alert("✅ Profile picture uploaded!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3 border rounded bg-light">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn btn-primary mt-2"
      >
        {uploading ? "Uploading..." : "Upload Picture"}
      </button>
    </div>
  );
}
