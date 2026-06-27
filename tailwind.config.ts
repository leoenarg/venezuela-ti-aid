import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#fafaf7",
        signal: "#0057b8",
        relief: "#2e7d32",
        alert: "#b3261e"
      }
    }
  },
  plugins: []
};

export default config;
