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
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

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
                setGameOver(null);
                setSelectedChoice(null);
            }
          }

          if (data.event === "new_question") {
            setQuestion(data.current_question);
            setGameOver(null);
            setSelectedChoice(null);
          }

          if (data.event === "answer_result") {
            setAnswers(prev => ({
            ...prev,
            [data.user_id]: data.correct
                ? (prev[data.user_id] || 0) + 1   
                : (prev[data.user_id] || 0)      
            }));

          }

          if (data.event === "game_over") {
            try { timerRef.current && clearInterval(timerRef.current); } catch {}
            setTimeLeft(0);
            setGameOver({ winnerId: data.winner, p1: data.p1_score, p2: data.p2_score });
          }

        },


        disconnected() {
          console.log("❌ Disconnected from QuizRoom");
        },
      }
    );

    return () => {
      try { quizRef.current && quizRef.current.unsubscribe(); } catch {}
      try { timerRef.current && clearInterval(timerRef.current); } catch {}
    };
  }, [token, roomId, navigate]);

  useEffect(() => {
    if (!question) return;
    try { timerRef.current && clearInterval(timerRef.current); } catch {}
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          try { timerRef.current && clearInterval(timerRef.current); } catch {}
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      try { timerRef.current && clearInterval(timerRef.current); } catch {}
    };
  }, [question]);

  const answer = (choice) => {
    if (selectedChoice !== null || timeLeft <= 0 || !!gameOver) return;
    setSelectedChoice(choice);
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
    padding: '12px 14px',
    transition: 'all 120ms ease'
  };

  const selectedBtnStyle = {
    border: '2px solid rgba(56,239,125,0.9)',
    background: 'linear-gradient(90deg, rgba(56,239,125,0.25), rgba(56,239,125,0.1))',
    boxShadow: '0 0 0 2px rgba(56,239,125,0.2)',
    transform: 'scale(1.02)'
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

  const scoreboardRow = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12
  };
  
  const playersRow = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 32
  };

  const scoreItem = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)'
  };

  const scoreName = {
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 600
  };

  const scoreBadge = {
    padding: '2px 6px',
    borderRadius: 8,
    background: 'rgba(56,239,125,0.18)',
    border: '1px solid rgba(56,239,125,0.35)',
    fontWeight: 700
  };

  const timerPill = {
    padding: '6px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    fontWeight: 700,
    minWidth: 48,
    textAlign: 'center'
  };

  const isTie = !!gameOver && gameOver.p1 === gameOver.p2;
  const winnerName = !!gameOver && roomInfo?.players?.find(p => p.id === gameOver.winnerId)?.name;

  const leaveRoom = () => {
    if (quizRef.current) {
      quizRef.current.send({ action: "leave_room" });
    }
    navigate("/prirodnjacki-kviz");
  };

  return (
    <div className="page-container">
      <div className="glass-card" style={{ padding: '1.2rem', maxWidth: 800, margin: '0 auto' }}>
        {gameOver ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '8px 0' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 0 }}>Kraj igre</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{gameOver.p1} : {gameOver.p2}</div>
            <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 10, background: 'rgba(56,239,125,0.18)', border: '1px solid rgba(56,239,125,0.35)', fontWeight: 700 }}>
              {isTie ? 'Nerešeno' : `Pobednik: ${winnerName || gameOver.winnerId}`}
            </div>
          </div>
        ) : question ? (
          <>
            {roomInfo?.players && (
              <div style={scoreboardRow}>
                <div style={playersRow}>
                  {roomInfo.players.map(p => (
                    <div key={p.id} style={scoreItem}>
                      <span style={scoreName}>{p.name}</span>
                      <span style={scoreBadge}>{answers[p.id] || 0}</span>
                    </div>
                  ))}
                </div>
                <div style={timerPill}>{timeLeft}s</div>
              </div>
            )}

            <p style={{ margin: '6px 0 14px', fontSize: '1.1rem' }}>{question.text}</p>
            <div style={optionsGrid}>
              <button className="btn-primary-modern" style={{ ...optionBtn, ...(selectedChoice === 'A' ? selectedBtnStyle : {}) }} onClick={() => answer('A')} disabled={timeLeft <= 0 || !!gameOver || selectedChoice !== null}>
                <span style={badgeStyle}>A</span>{question.a}
              </button>
              <button className="btn-primary-modern" style={{ ...optionBtn, ...(selectedChoice === 'B' ? selectedBtnStyle : {}) }} onClick={() => answer('B')} disabled={timeLeft <= 0 || !!gameOver || selectedChoice !== null}>
                <span style={badgeStyle}>B</span>{question.b}
              </button>
              <button className="btn-primary-modern" style={{ ...optionBtn, ...(selectedChoice === 'C' ? selectedBtnStyle : {}) }} onClick={() => answer('C')} disabled={timeLeft <= 0 || !!gameOver || selectedChoice !== null}>
                <span style={badgeStyle}>C</span>{question.c}
              </button>
              <button className="btn-primary-modern" style={{ ...optionBtn, ...(selectedChoice === 'D' ? selectedBtnStyle : {}) }} onClick={() => answer('D')} disabled={timeLeft <= 0 || !!gameOver || selectedChoice !== null}>
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
