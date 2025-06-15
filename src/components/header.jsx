import React from "react";

export const Header = (props) => {
  return (
    <header>
      <div className="logo">
        <h1>Hajki.com</h1>
      </div>
      <nav>
        <a href="/">Početna</a>
        <a href="/routes">Rute</a>
        <a href="/new-route">Nova ruta</a>
        <a href="/login">Prijava</a>
      </nav>
      <button aria-label="Toggle navigation">
        <span>☰</span>
      </button>
    </header>
  );
};
