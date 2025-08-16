import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// WICHTIG: Tailwind + Theme-Tokens laden
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
