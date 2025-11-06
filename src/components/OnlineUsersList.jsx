import React, { useEffect, useState } from "react";
import { connectWebsocket } from "../cable";
import { config } from "../config";

export default function OnlineUsersList({ token }) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    fetch(`${config.apiUrl}/online_users`)
      .then(res => res.json())
      .then(data => setOnlineUsers(data));

    // 2. open ActionCable WebSocket
    const consumer = connectWebsocket(token);

    // 3. subscribe to PresenceChannel
    const presence = consumer.subscriptions.create(
      { channel: "PresenceChannel" },
      {
        received(data) {
          // korisnik se pridružio
          if (data.event === "join") {
            setOnlineUsers(prev => {
              // izbegni duplikate
              if (prev.find(u => u.id === data.user.id)) return prev;
              return [...prev, data.user];
            });
          }

          // korisnik otišao offline
          if (data.event === "leave") {
            setOnlineUsers(prev => prev.filter(u => u.id !== data.user));
          }
        }
      }
    );

    return () => {
      presence.unsubscribe();
    };
  }, [token]);

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Prirodnjački kviz (uskoro)</h1>
        <p style={{ marginTop: '0.5rem' }}>Online korisnici u realnom vremenu</p>
      </div>

      <div className="glass-card" style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ marginTop: 0 }}>Online korisnici ({onlineUsers.length})</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {onlineUsers.map(user => (
            <li
              key={user.id}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(56,239,125,0.25)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#38ef7d',
                display: 'inline-block'
              }} />
              <span>{user.name || user.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
