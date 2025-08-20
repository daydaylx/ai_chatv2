/** Was & Warum:
 * In ESM-Projekten (package.json: "type":"module") muss eine CommonJS-PostCSS
 * als .cjs vorliegen, wenn wir module.exports nutzen.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
