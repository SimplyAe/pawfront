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
        "gu-bg": "#14141e",
        "gu-navbar": "#2f2f3b",
        "gu-card": "#1e1e2a",
        "gu-card-alt": "#252534",
        "gu-border": "#3a3a4e",
        "gu-pink": "#d55b9e",
        "gu-pink-light": "#e87bbf",
        "gu-muted": "rgba(255,255,255,0.5)",
        "gu-online": "#68d57f",
        "gu-offline": "rgba(255,255,255,0.35)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
