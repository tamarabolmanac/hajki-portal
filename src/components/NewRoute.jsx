import React, { useState } from "react";
import '../styles/NewRoute.css';

export const NewRoute = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/new_route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create route");
      }

      setMessage("Route created successfully!");
      setTitle("");
      setDescription("");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="new-route-container">
      <h2>Add a New Hiking Route</h2>
      <form onSubmit={handleSubmit} className="route-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="form-control"
            rows="5"
          ></textarea>
        </div>

        <button type="submit" className="submit-button">Add Route</button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};
