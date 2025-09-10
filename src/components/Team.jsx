import React from "react";

export const Team = (props) => {
  return (
    <div id="team" className="text-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 section-title">
          <h2>Upoznajte naš tim</h2>
          <p>
            Naš tim je posvećen pružanju najboljeg iskustva za sve ljubitelje prirode.
          </p>
        </div>
        <div className="row">
          {props.data ? (
            props.data.map((d, i) => (
              <div key={`${d.name}-${i}`} className="col-md-3 col-sm-6 team">
                <div className="thumbnail">
                  <img src={d.img} alt={d.name} className="team-img" />
                  <div className="caption">
                    <h4>{d.name}</h4>
                    <p>{d.job}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Učitavanje tima...</p>
          )}
        </div>
      </div>
    </div>
  );
};
