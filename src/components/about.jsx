import React from "react";

export const About = (props) => {
  return (
    <div id="about">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-6">
            <img src="img/about.jpg" className="img-responsive" alt="A person hiking in the mountains." />
          </div>
          <div className="col-xs-12 col-md-6">
            <div className="about-text">
              <h2>O nama</h2>
              <p>
                Hajki.rs je nastao sa idejom da svi obožavaoci prirode, na jednom mestu, pronađu odgovarajuće avanture za sebe, a pored toga i podele svoja iskustva sa drugima.
                Prvi sajt u Srbiji koji zaviruje u najsitnije kutke nacionalnih parkova i prirodnih rezervata, omogućavajući ljudima da se povežu i saznaju više o našoj zemlji i okolini.
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
