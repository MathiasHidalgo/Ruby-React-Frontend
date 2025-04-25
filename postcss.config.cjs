// postcss.config.cjs - Renamed to .cjs for ES module projects
module.exports = {
  plugins: {
    // Use the new package for the Tailwind CSS PostCSS plugin
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

// Explanation:
// - This configuration file is for PostCSS, which Tailwind uses to process your CSS.
// - It now correctly references the `@tailwindcss/postcss` plugin.
// - Autoprefixer adds vendor prefixes (like -webkit-, -moz-) to your CSS for better
//   browser compatibility.
// - The file extension is .cjs to ensure it's treated as a CommonJS module
//   in projects configured for ES modules ("type": "module" in package.json).
