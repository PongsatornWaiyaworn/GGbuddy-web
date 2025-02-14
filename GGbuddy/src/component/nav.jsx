import { useState } from "react";
import "./nav.css";

export default function Sidebar() {
  const [active, setActive] = useState("Home");

  return (
    <div className="sidebar">
      <img src="/LOGO GGbuddy.png" alt="GGbuddy Logo" width={'50px'}/>
      <nav>
        <button
          className={`nav-button ${active === "Home" ? "active" : ""}`}
          onClick={() => setActive("Home")}
        >
          H
        </button>
        <button
          className={`nav-button ${active === "Profile" ? "active" : ""}`}
          onClick={() => setActive("Profile")}
        >
          P
        </button>
        <button
          className={`nav-button ${active === "Settings" ? "active" : ""}`}
          onClick={() => setActive("Settings")}
        >
          S
        </button>
      </nav>
    </div>
  );
}