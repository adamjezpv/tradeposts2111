import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "grid-move": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(60px)" },
        },
        "blob-drift-1": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "25%": { transform: "translate(50px, -70px) scale(1.06)" },
          "50%": { transform: "translate(-40px, 50px) scale(0.96)" },
          "75%": { transform: "translate(70px, 30px) scale(1.04)" },
        },
        "blob-drift-2": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(-60px, 50px) scale(1.08)" },
          "66%": { transform: "translate(40px, -60px) scale(0.93)" },
        },
        "blob-drift-3": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-30px, -40px) scale(1.05)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.8s ease-out forwards",
        "fade-in": "fade-in 1s ease-out forwards",
        "spin-slow": "spin-slow 20s linear infinite",
        "grid-move": "grid-move 12s linear infinite",
        "blob-drift-1": "blob-drift-1 35s ease-in-out infinite",
        "blob-drift-2": "blob-drift-2 45s ease-in-out infinite",
        "blob-drift-3": "blob-drift-3 28s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
