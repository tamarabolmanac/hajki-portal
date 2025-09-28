import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your account...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setMessage("Invalid token.");
      return;
    }
    fetch(`https://api.hajki.com/users/confirm?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json(); // prosleđuje data u sledeći .then
      })
      .then(data => {
        setMessage(data.message);
        setTimeout(() => navigate("/login"), 2000); // redirect
      })
      .catch(err => setMessage(err.message || "Something went wrong."));
    
  }, [navigate]);

  return <div>{message}</div>;
}
