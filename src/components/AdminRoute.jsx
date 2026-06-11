import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/api";
import AppLoader from "./AppLoader";

// Štiti admin rute: dozvoljava pristup samo prijavljenim korisnicima sa role === 'admin'.
// Rolu potvrđuje sa servera (/user_data) — ne oslanja se samo na localStorage koji se može menjati.
const AdminRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem("authToken");
  const [status, setStatus] = useState("checking"); // checking | allowed | denied

  useEffect(() => {
    if (!isLoggedIn) {
      setStatus("denied");
      return;
    }
    let active = true;
    authenticatedFetch("/user_data")
      .then((data) => {
        if (!active) return;
        setStatus(data?.role === "admin" ? "allowed" : "denied");
      })
      .catch(() => active && setStatus("denied"));
    return () => { active = false; };
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (status === "checking") return <AppLoader title="Provera pristupa..." />;
  if (status === "denied") return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
