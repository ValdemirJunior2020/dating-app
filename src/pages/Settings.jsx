import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase"; // adjust path if needed
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Settings = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUserData(snap.data());
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload photo to Firebase
  const handlePhotoUpload = async () => {
    const user = auth.currentUser;
    if (!user || !file) return;

    const storageRef = ref(storage, `photos/${user.uid}/${Date.now()}-${file.name}`);

    try {
      // Upload file to storage
      await uploadBytes(storageRef, file);

      // Get downloadable URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save the download URL in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        photos: [downloadURL], // ✅ store actual URL instead of UID
      });

      alert("Photo uploaded successfully!");
      setUserData((prev) => ({
        ...prev,
        photos: [downloadURL],
      }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="settings">
      <h1>Settings</h1>

      {userData && (
        <div>
          <p><strong>Name:</strong> {userData.displayName || "No name"}</p>
          <p><strong>Email:</strong> {userData.email}</p>

          {/* Show profile photo if exists */}
          {userData.photos && userData.photos.length > 0 ? (
            <img
              src={userData.photos[0]}
              alt="Profile"
              style={{ width: "150px", borderRadius: "10px" }}
            />
          ) : (
            <p>No photo uploaded.</p>
          )}

          <div style={{ marginTop: "20px" }}>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handlePhotoUpload}>Upload Photo</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
