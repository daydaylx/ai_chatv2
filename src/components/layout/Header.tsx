import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ThemeSwitcher } from "./ThemeSwitcher";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/70 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="text-xl">✨</span>
          <span>Pro UI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/">Übersicht</NavItem>
          <NavItem to="/styles">Stile</NavItem>
          <NavItem to="/builder">Prompt-Builder</NavItem>
          <NavItem to="/settings">Einstellungen</NavItem>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="md:hidden">
        <div className="container flex gap-1 pb-3">
          <NavItem to="/">Übersicht</NavItem>
          <NavItem to="/styles">Stile</NavItem>
          <NavItem to="/builder">Builder</NavItem>
          <NavItem to="/settings">Settings</NavItem>
        </div>
      </div>
    </header>
  );
};

const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-1.5 rounded-lg text-sm ${isActive ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`
    }
  >
    {children}
  </NavLink>
);
