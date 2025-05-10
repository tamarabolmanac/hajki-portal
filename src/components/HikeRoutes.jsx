import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HikeRoutes.css'


export const HikeRoutes = (props) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/routes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log(data.data)
        setData(data.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);


  return (
    <div id="features" className="text-center">
      <div className="container">
        <div className="header-with-button">
          <h2 className="menu-item-title">Pretraži rute</h2>
          <Link to="/new-route" className="add-route-button">
            + Dodaj rutu
          </Link>
        </div>

        <div className="row">
          {data
            ? data.map((d, i) => (
                <div key={`${d.title}-${i}`} className="col-xs-6 col-md-3">
                  <h3>{d.title}</h3>
                  <p>{d.description}</p>
                </div>
              ))
            : "Loading..."}
        </div>
      </div>
    </div>
  );
};
