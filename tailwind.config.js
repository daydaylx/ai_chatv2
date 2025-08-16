/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      boxShadow: { soft: "0 2px 10px rgba(0,0,0,0.08)" },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
