import React from "react";

export const Testimonials = (props) => {
  return (
    <div id="testimonials">
      <div className="container">
        <div className="section-title text-center">
          <h2>Šta naši korisnici kažu</h2>
        </div>
        <div className="row">
          {props.data ? (
            props.data.map((d, i) => (
              <div key={`${d.name}-${i}`} className="col-sm-6 col-md-4">
                <div className="testimonial">
                  <div className="testimonial-image">
                    <img src={d.img} alt={d.name} />
                  </div>
                  <div className="testimonial-content">
                    <p>"{d.text}"</p>
                    <div className="testimonial-meta"> - {d.name} </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Učitavanje utisaka...</p>
          )}
        </div>
      </div>
    </div>
  );
};
