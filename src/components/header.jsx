import React from "react";

export const Header = (props) => {
  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
                <h1>
                  Hajki.com
                  <span></span>
                </h1>
                <p>Mesto za ljubitelje prirode</p>
                <a
                  href="/login" 
                  className="btn btn-custom btn-lg page-scroll"
                > {/* #features */}
                  Otkrijte više
                </a>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
