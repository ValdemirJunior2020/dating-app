import React, { useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function PhotoUploader({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `photos/${user.uid}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(pct);
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        // Save photo URL to Firestore
        await updateDoc(doc(db, "users", user.uid), {
          photos: arrayUnion(url),
          updatedAt: Date.now(),
        });

        onUpload(url);
        setUploading(false);
        setProgress(0);
      }
    );
  };

  return (
    <div className="border p-4 rounded bg-gray-50">
      <label className="block font-semibold mb-2">Upload Photo</label>
      <input type="file" accept="image/*" onChange={handleUpload} />

      {uploading && (
        <div className="mt-2">
          <p>Uploading... {Math.round(progress)}%</p>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
