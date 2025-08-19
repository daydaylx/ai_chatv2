import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css"; // <-- einziges globales CSS, MUSS NACH allen alten Styles kommen (alte Imports löschen)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
