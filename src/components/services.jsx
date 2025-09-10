import React from "react";

export const Services = (props) => {
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Naše Usluge</h2>
          <p>
            Nudimo širok spektar usluga kako bismo vaše avanture učinili nezaboravnim.
          </p>
        </div>
        <div className="row">
          {props.data ? (
            props.data.map((d, i) => (
              <div key={`${d.name}-${i}`} className="col-sm-6 col-md-4">
                <i className={d.icon}></i>
                <div className="service-desc">
                  <h3>{d.name}</h3>
                  <p>{d.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Učitavanje usluga...</p>
          )}
        </div>
      </div>
    </div>
  );
};
