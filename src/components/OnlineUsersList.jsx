import React from "react";
import { config } from "../config";

export default function OnlineUsersList({ onlineUsers, currentUserId, onChallenge, hideHeader }) {
  const selfIdNum = Number(currentUserId);

  const avatarStyle = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  };

  const fullUrl = (p) => {
    if (!p) return null;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${config.apiUrl}${p}`;
  };

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
              {user.avatar_url ? (
                <img src={fullUrl(user.avatar_url)} alt="" style={avatarStyle} />
              ) : (
                <div style={avatarStyle}>{(user.name || user.email || "?").slice(0,1).toUpperCase()}</div>
              )}
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
