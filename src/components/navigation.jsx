import React from "react";
import { Link, useNavigate } from 'react-router-dom';

export const Navigation = (props) => {

  const navigate = useNavigate();

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate("/"); // idi na root
    setTimeout(() => {
      const element = document.getElementById("about");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100); // malo zakašnjenje dok se DOM učita
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
     
      <a className="navbar-brand page-scroll" href="#page-top">
            
          </a>
        <div className="navbar-header">
        <img  className="logo-navbar" src="../../img/logo_small.png" ></img>
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            {" "}
            <span className="sr-only">Toggle navigation</span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
          </button>
          
          
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <Link to="/routes">
                Pretraži rute
              </Link>
            </li>
            {/*
            <li>
              <a href="#services" className="page-scroll">
                Gde za vikend?
              </a>
            </li>
            <li>
              <a href="#portfolio" className="page-scroll">
                Mapa
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll">
                Kontakt
              </a>
            </li>
            */}
            <li>
              <a href="#about" className="page-scroll" onClick={handleAboutClick}>
                O nama
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
