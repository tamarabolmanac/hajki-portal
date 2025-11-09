import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnlineUsersList from "./OnlineUsersList";
import { connectWebsocket } from "../cable";
import { config } from "../config";

export default function QuizLobby({ token, currentUserId }) {
  const navigate = useNavigate();

  const challengeRef = useRef(null);        // ChallengeChannel subscription
  const [wsReady, setWsReady] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  // Inline stilovi za modal
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(2px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalStyle = {
    background: "rgba(17, 153, 142, 0.12)",
    backdropFilter: "blur(25px)",
    border: "1px solid rgba(56, 239, 125, 0.25)",
    boxShadow: "0 8px 32px rgba(17, 153, 142, 0.15)",
    borderRadius: 16,
    padding: 24,
    width: "min(480px, 90%)",
    color: "rgba(255,255,255,0.95)",
  };

  const modalActions = {
    display: "flex",
    gap: 12,
    marginTop: 16,
    justifyContent: "flex-end",
  };

  // 1) Učitavanje početne liste + otvaranje JEDNE WS konekcije
  useEffect(() => {
    // fetch initial online users
    

    // open ActionCable consumer
    const consumer = connectWebsocket(token);

    // PRESENCE CHANNEL
    const presenceSub = consumer.subscriptions.create(
      { channel: "PresenceChannel" },
      {
        received(data) {
          if (data?.event === "join" && data.user) {
            setOnlineUsers((prev) => {
              const id = Number(data.user.id);
              return prev.some((u) => Number(u.id) === id) ? prev : [...prev, data.user];
            });
          }

          if (data?.event === "leave") {
            const leavingId = Number(data.user);
            setOnlineUsers((prev) => prev.filter((u) => Number(u.id) !== leavingId));
          }
        },
      }
    );

    fetch(`${config.apiUrl}/online_users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        setOnlineUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setOnlineUsers([]));

    // CHALLENGE CHANNEL
    const challengeSub = consumer.subscriptions.create(
      { channel: "ChallengeChannel" },
      {
        connected() {
          setWsReady(true);
        },
        received(data) {
          // Debug ako zatreba:
          // console.log("📩 PRIMLJENA PORUKA:", data);

          if (data?.event === "challenge_received") {
            setIncomingChallenge(data); // otvara modal
          }

          if (data?.event === "challenge_accepted" && data?.room_id) {
            navigate(`/quiz/${data.room_id}`);
          }
        },
        disconnected() {
          setWsReady(false);
        },
      }
    );

    // sačuvaj ref na challenge sub
    challengeRef.current = challengeSub;

    // cleanup na unmount
    return () => {
      try { presenceSub.unsubscribe(); } catch {}
      try { challengeSub.unsubscribe(); } catch {}
    };
  }, [token, navigate]);

  // 2) Slanje poziva na duel
  const sendChallenge = (opponentId) => {
    if (!challengeRef.current) return;          // WS nije spreman
    challengeRef.current.send({
      action: "send_challenge",
      opponent_id: opponentId,
    });
  };

  // 3) Prihvatanje izazova
  const acceptChallenge = (challengeData) => {
    if (!challengeRef.current) return;
    challengeRef.current.send({
      action: "accept_challenge",
      opponent_id: challengeData.from_id,
    });
    setIncomingChallenge(null);
  };

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Prirodnjački kviz</h1>
        <p style={{ marginTop: "0.5rem" }}>
          Odaberi protivnika i pošalji izazov
          {!wsReady && <span style={{ marginLeft: 8, opacity: 0.7 }}>(povezivanje...)</span>}
        </p>
      </div>

      <OnlineUsersList
        onlineUsers={onlineUsers}
        currentUserId={currentUserId}
        onChallenge={sendChallenge}
        hideHeader
      />

      {incomingChallenge && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <p>
              <strong>{incomingChallenge.from_name}</strong> te izaziva na kviz!
            </p>
            <div style={modalActions}>
              <button
                className="btn-primary-modern"
                onClick={() => acceptChallenge(incomingChallenge)}
                disabled={!wsReady}
              >
                Prihvati
              </button>
              <button
                className="btn-secondary-modern"
                onClick={() => setIncomingChallenge(null)}
              >
                Odbij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
