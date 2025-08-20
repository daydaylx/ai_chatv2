import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: ["./index.html","./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [],
} satisfies Config;
