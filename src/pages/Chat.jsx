// src/pages/Chat.jsx
import React from "react";
import { useParams } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const { matchId } = useParams();

  return (
    <div className="container py-4">
      <h2 className="mb-3">Chat</h2>

      {matchId ? (
        <ChatWindow matchId={matchId} />
      ) : (
        <p className="text-light">
          Select a match to start chatting.
        </p>
      )}
    </div>
  );
}
