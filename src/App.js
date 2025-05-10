import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from "./components/navigation";
import { Header } from "./components/header";
import { HikeRoutes } from "./components/HikeRoutes";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { NewRoute } from "./components/NewRoute";
import { Contact } from "./components/contact";
import JsonData from "./data/data.json";
import "./App.css";

const App = () => {
  const [landingPageData, setLandingPageData] = useState({});

  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <Router>
      <Navigation />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header data={landingPageData.Header} />
              <HikeRoutes data={landingPageData.HikeRoutes} />
              <About data={landingPageData.About} />
              <Services data={landingPageData.Services} />
              <Gallery data={landingPageData.Gallery} />
              <Testimonials data={landingPageData.Testimonials} />
              <Team data={landingPageData.Team} />
              <Contact data={landingPageData.Contact} />
            </>
          }
        />
        <Route path="/routes" element={<HikeRoutes />} />
        <Route path="/new-route" element={<NewRoute />} />
      </Routes>
    </Router>
  );
};

export default App;
