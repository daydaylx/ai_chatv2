import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ClientProvider } from "./lib/client";
import { PersonaProvider } from "./entities/persona";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClientProvider>
      <PersonaProvider>
        <App />
      </PersonaProvider>
    </ClientProvider>
  </React.StrictMode>
);
