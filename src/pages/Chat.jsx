// src/pages/Chat.jsx
import React from "react";
import { useParams } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  // support either /chat/:matchId  OR  /chat/with/:otherUid
  const { matchId, otherUid } = useParams();
  return (
    <div className="container py-4">
      <h2 className="mb-3">Chat</h2>
      <ChatWindow matchId={matchId} otherUid={otherUid} />
    </div>
  );
}
