import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import LiveChat from "./components/LiveChat.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <LiveChat />
    </>
  </React.StrictMode>
);
