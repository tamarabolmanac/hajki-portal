// src/components/QuizRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectWebsocket } from "../cable";
import { config } from "../config";

export default function QuizRoom({ token }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const quizRef = useRef(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);

  // povezivanje na kanal
  useEffect(() => {
    const consumer = connectWebsocket(token);

    quizRef.current = consumer.subscriptions.create(
      { channel: "QuizRoomChannel", room_id: roomId },
      {
        connected() {
          console.log("✅ Connected to QuizRoomChannel:", roomId);

          // opcionalno: tražimo info o sobi
          quizRef.current.send({ action: "room_info" });
        },

        received(data) {
          console.log("📩 ROOM MSG:", data);

          if (data.event === "room_info") {
            setRoomInfo(data);
          }

          if (data.event === "system_message") {
            setMessages(prev => [...prev, data.text]);
          }

          if (data.event === "leave_room") {
            navigate("/prirodnjacki-kviz");
          }
        },

        disconnected() {
          console.log("❌ Disconnected from QuizRoom");
        },
      }
    );

    return () => {
      try { quizRef.current && quizRef.current.unsubscribe(); } catch {}
    };
  }, [token, roomId, navigate]);

  const leaveRoom = () => {
    if (quizRef.current) {
      quizRef.current.send({ action: "leave_room" });
    }
    navigate("/prirodnjacki-kviz");
  };

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Quiz soba #{roomId}</h1>
        <p>Čekamo protivnika ili početak igre…</p>
      </div>

      <div className="glass-card" style={{ padding: "1.2rem" }}>
        <h3>Poruke iz sobe:</h3>
        <ul style={{ marginTop: 12 }}>
          {messages.map((m, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{m}</li>
          ))}
        </ul>
      </div>

      <button
        style={{ marginTop: 20 }}
        className="btn-secondary-modern"
        onClick={leaveRoom}
      >
        Napusti sobu
      </button>
    </div>
  );
}
