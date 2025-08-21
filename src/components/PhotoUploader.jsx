import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext"; // adjust import if different

const storage = getStorage();
const db = getFirestore();

export default function PhotoUploader() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!currentUser) {
      alert("You must be logged in to upload photos");
      return;
    }

    if (files.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    setUploading(true);
    try {
      const uid = currentUser.uid;
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `photos/${uid}/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const urls = await Promise.all(uploadPromises);

      // 🔑 Save URLs into Firestore
      await updateDoc(doc(db, "users", uid), {
        photos: arrayUnion(...urls),
        updatedAt: Date.now(),
      });

      alert("Photos uploaded successfully!");
      setFiles([]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photos. See console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{ marginLeft: "10px" }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
