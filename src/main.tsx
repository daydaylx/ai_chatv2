import './styles/tokens.css';
import './styles/app.css';
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerSW } from "./registerSW";

const root = createRoot(document.getElementById("root")!);
root.render(<React.StrictMode><App/></React.StrictMode>);

// PWA
registerSW("/sw.js");
