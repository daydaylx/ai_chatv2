import "./styles/tokens.css";
import "./styles/app.css";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "./registerSW";

const root = createRoot(document.getElementById("root")!);
root.render(<React.StrictMode><App/></React.StrictMode>);

// PWA registrieren
registerSW("/sw.js");
