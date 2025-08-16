import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Styles from "@/pages/Styles";
import PromptBuilder from "@/pages/PromptBuilder";
import Settings from "@/pages/Settings";
import { Header } from "@/components/layout/Header";

export default function App() {
  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/styles" element={<Styles />} />
          <Route path="/builder" element={<PromptBuilder />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
