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
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState({});

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

          if (data.event === "system_message") {
            setMessages(prev => [...prev, data.text]);
          }

          if (data.event === "leave_room") {
            navigate("/prirodnjacki-kviz");
          }

          if (data.event === "room_info") {
            setRoomInfo(data);
            if (data.current_question) {
                setQuestion(data.current_question);
            }
          }

          if (data.event === "new_question") {
            setQuestion(data.current_question);
          }

          if (data.event === "answer_result") {
            setAnswers(prev => ({
            ...prev,
            [data.user_id]: data.correct
                ? (prev[data.user_id] || 0) + 1   
                : (prev[data.user_id] || 0)      
            }));

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

  const answer = (choice) => {
    quizRef.current.send({
        action: "answer_question",
        room_id: roomId,
        answer: choice,
        question_id: question.id
    });
   };

  const optionsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginTop: 12
  };

  const optionBtn = {
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px'
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'rgba(56,239,125,0.20)',
    border: '1px solid rgba(56,239,125,0.35)',
    color: 'rgba(255,255,255,0.95)',
    fontWeight: 600,
    marginRight: 10,
    fontSize: 13
  };


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
        <p style={{ marginTop: '0.5rem' }}>Odaberi tačan odgovor među ponuđenim opcijama</p>

      </div>

      <div className="glass-card" style={{ padding: '1.2rem', maxWidth: 800, margin: '0 auto' }}>
        {question ? (
          <>
            {roomInfo?.players && (
                <div className="room-info" style={{ marginTop: 16 }}>
                <h3>Igrači u sobi:</h3>
                {roomInfo.players.map(p => (
                <div key={p.id} style={{ marginBottom: 8 }}>
                    {p.name}
                    <span style={{ marginLeft: 6, color: "lightgreen" }}>{answers[p.id]}</span>
     
                </div>
                ))}
        </div>
        )}
        <br/>
        <h3 style={{ marginTop: 0 }}>Pitanje</h3>

            <p style={{ margin: '8px 0 16px', fontSize: '1.1rem' }}>{question.text}</p>
            <div style={optionsGrid}>
              <button className="btn-primary-modern" style={optionBtn} onClick={() => answer('A')}>
                <span style={badgeStyle}>A</span>{question.a}
              </button>
              <button className="btn-primary-modern" style={optionBtn} onClick={() => answer('B')}>
                <span style={badgeStyle}>B</span>{question.b}
              </button>
              <button className="btn-primary-modern" style={optionBtn} onClick={() => answer('C')}>
                <span style={badgeStyle}>C</span>{question.c}
              </button>
              <button className="btn-primary-modern" style={optionBtn} onClick={() => answer('D')}>
                <span style={badgeStyle}>D</span>{question.d}
              </button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0 }}>Čekamo prvo pitanje…</p>
        )}

      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <button className="btn-secondary-modern" onClick={leaveRoom}>Napusti sobu</button>
      </div>
    </div>
  );
}
