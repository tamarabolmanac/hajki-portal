import React from "react";
import "../styles/contact.css";

export const Contact = (props) => {
  return (
    <div id="contact">
      <div className="container">
        <div className="contact-content">
          <h3 className="contact-title">Povežite se sa nama</h3>
          <p>
            Imate pitanje o rutama? Želite da podelite svoje iskustvo ili predlog? 
            Kontaktirajte nas - tu smo da vam pomognemo u vašoj sledećoj avanturi! 🏔️
          </p>
          <p>
            Naš tim je uvek spreman da odgovori na vaša pitanja o pešačkim rutama, 
            biciklističkim stazama ili bilo čemu što se tiče aktivnog provođenja vremena u prirodi.
          </p>
          <h3 className="contact-title">Kako možete da nas kontaktirate?</h3>
          <ul className="contact-list">
            <li>📧 Pošaljite nam email na: <strong>info@hajki.rs</strong></li>
            <li>📱 Pozovite nas: <strong>+381 62 871 43 65</strong></li>
            <li>💬 Pratite nas na društvenim mrežama za najnovije rute i savete</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
