import React from "react";
import "./HeroSection.css";

const HeroSection = ({
  titlePre = "AI-powered radiological scanning for humanitarian response",
  titleHighlight = "",
  subtitle = "Get results of your scans in seconds!",
  ctaLabel = "Try It Now",
  onCtaClick = () => {
    <a href = "Uploader.jsx"></a>;
  },
}) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="title-pre">{titlePre}</span>
          <span className="title-highlight">{titleHighlight}</span>
        </h1>

        <p className="hero-subtitle">{subtitle}</p>

        <button className="hero-cta" onClick={onCtaClick}>
          <span className="slashes">\\</span> {ctaLabel}
        </button>

      </div>
    </section>
  );
};

export default HeroSection;
