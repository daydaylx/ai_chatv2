import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "./registerSW";

registerSW(); // keine Argumente – Pfad ist in registerSW hart verdrahtet

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
