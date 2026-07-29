import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import {
  labUnlockFromPath,
  labUnlockFromUrl,
  setLabUnlocked,
} from "./utils/secretMenu.js";

if (
  labUnlockFromPath(window.location.pathname) ||
  labUnlockFromUrl(
    window.location.search,
    window.location.hash,
    window.location.pathname
  )
) {
  setLabUnlocked(true);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
