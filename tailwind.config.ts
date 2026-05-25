import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1a472a",
          "green-light": "#2d6a4f",
          "green-dark": "#0f2d1a",
          gold: "#f59e0b",
          "gold-light": "#fbbf24",
          "gold-dark": "#d97706",
        },
      },
    },
  },
  plugins: [],
};

export default config;
