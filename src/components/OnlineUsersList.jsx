import React from "react";

export default function OnlineUsersList({ onlineUsers, currentUserId, onChallenge, hideHeader }) {
  const selfIdNum = Number(currentUserId);

  const listCard = (
    <div className="glass-card" style={{ maxWidth: 700, margin: "0 auto" }}>
      <h3 style={{ marginTop: 0 }}>Online korisnici ({onlineUsers.length})</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {onlineUsers.map((user) => (
          <li
            key={user.id}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(56,239,125,0.25)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#38ef7d",
                  display: "inline-block",
                }}
              />
              <span>{user.name || user.email}</span>
            </div>

            {Number(user.id) !== selfIdNum && (
              <button
                className="btn-secondary-modern"
                onClick={() => onChallenge(user.id)}
              >
                Izazovi
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  if (hideHeader) return listCard;

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Prirodnjački kviz</h1>
        <p style={{ marginTop: "0.5rem" }}>Online korisnici u realnom vremenu</p>
      </div>
      {listCard}
    </div>
  );
}
