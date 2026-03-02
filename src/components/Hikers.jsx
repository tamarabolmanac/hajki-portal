import React, { useEffect, useState } from "react";
import { config } from "../config";
import { BackgroundImage } from "./BackgroundImage";
import "../styles/RoutesList.css";

export const Hikers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${config.apiUrl}/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || "Neuspešno učitavanje korisnika.");
        }

        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleFollow = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${config.apiUrl}/users/${userId}/${isFollowing ? "unfollow" : "follow"}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Greška pri ažuriranju praćenja.");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_following: !isFollowing } : u
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (!normalizedSearch) return true;
    return (
      u.name?.toLowerCase().includes(normalizedSearch) ||
      u.email?.toLowerCase().includes(normalizedSearch) ||
      u.city?.toLowerCase().includes(normalizedSearch) ||
      u.country?.toLowerCase().includes(normalizedSearch)
    );
  });

  if (loading) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage
            src="/img/routes-bgd.jpg"
            alt=""
            className="routes-bg-image"
            fetchPriority="low"
          />
          <div className="routes-overlay" />
        </div>
        <div className="page-container">
          <div className="loading-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="loading-spinner-modern" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage
            src="/img/routes-bgd.jpg"
            alt=""
            className="routes-bg-image"
            fetchPriority="low"
          />
          <div className="routes-overlay" />
        </div>
        <div className="page-container">
          <div className="alert-error-modern">
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem" }}>⚠️ Greška</h3>
            <p style={{ margin: 0, fontSize: "1.1rem" }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage
          src="/img/routes-bgd.jpg"
          alt=""
          className="routes-bg-image"
          fetchPriority="low"
        />
        <div className="routes-overlay" />
      </div>

      <div className="page-container">
        <div className="page-header clean">
          <h1>Pretraži planinare</h1>
        </div>

        <div className="glass-card">
          <div style={{ marginBottom: "2rem" }}>
            <input
              type="text"
              placeholder="🔍 Pretraži po imenu, emailu ili gradu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input-modern"
              style={{
                width: "100%",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "2px solid rgba(255, 255, 255, 0.1)",
              }}
            />
            {search && (
              <p
                style={{
                  marginTop: "0.5rem",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.9rem",
                }}
              >
                Pronađeno planinara: {filtered.length}
              </p>
            )}
          </div>

          <div className="hike-cards-container">
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 2rem",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>
                  Nema korisnika koji odgovaraju pretrazi.
                </p>
              </div>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="hike-card">
                  <div className="hike-card-content" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#e2e8f0",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        color: "#4a5568",
                        fontSize: "1.2rem",
                      }}
                    >
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                        />
                      ) : (
                        (u.name || u.email || "?")
                          .trim()
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="hike-title" style={{ marginBottom: "0.25rem" }}>
                        {u.name}
                        {u.is_me && (
                          <span style={{ marginLeft: 8, fontSize: 12, color: "#718096" }}>
                            (ti)
                          </span>
                        )}
                      </h3>
                      <p
                        className="hike-description"
                        style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}
                      >
                        {u.email}
                      </p>
                      <p
                        className="hike-description"
                        style={{ marginBottom: 0, fontSize: "0.9rem" }}
                      >
                        {u.city && u.country ? `${u.city}, ${u.country}` : u.city || u.country}
                      </p>
                    </div>
                    {!u.is_me && (
                      <div className="hike-card-footer">
                        <button
                          type="button"
                          className={u.is_following ? "btn-secondary-modern" : "btn-primary-modern"}
                          style={{ borderRadius: 8, minWidth: 120 }}
                          onClick={() => toggleFollow(u.id, u.is_following)}
                        >
                          {u.is_following ? "Pratiš" : "Prati"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

