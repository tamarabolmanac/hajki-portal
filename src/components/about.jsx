import React from "react";
import "../styles/about.css";

export const About = (props) => {
  return (
    <div id="about">
      
      <div className="container">
        <div className="row">
         
          <div className="col-xs-12 col-md-6">
            <div className="about-text">
              <h3>Svaki dan zaslužuje trag u prirodi</h3>
              <p>
                Mnogi od nas vole da provode slobodno vreme na svežem vazduhu, a često i da zabeleže to na fotografiji 🌱! 
                Ponekad nije loše imati i mali dnevnik mesta koje smo posećivali, a još bolje, podeliti ta iskustva sa ostalima!
                Zato smo napravili <b>Hajki</b>, da zajedno beležimo spontane trenutke na različitim lokacijama. 
              </p>
              <h3>Šta hajki.rs omogućava?</h3>
              <ul className="list-style">
                <li>Pretragu pešačkih i biciklističkih ruta širom Srbije</li>
                <li>Praćenje hajkera međusobno</li>
                <li>Podelu slika i opis ruta na koje ste išli</li>
                <li>Ocenjivanje ruta i komentari o sopstvenim iskustvima</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
