import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "rgba(255,255,255,0.07)",
        input: "rgba(255,255,255,0.07)",
        ring: "#00ff88",
        background: "#080c12",
        foreground: "rgba(255,255,255,0.9)",
        primary: { DEFAULT: "#00ff88", foreground: "#080c12" },
        secondary: { DEFAULT: "#a78bfa", foreground: "#080c12" },
        destructive: { DEFAULT: "#f87171", foreground: "#080c12" },
        muted: { DEFAULT: "rgba(255,255,255,0.05)", foreground: "rgba(255,255,255,0.4)" },
        accent: { DEFAULT: "#00ff88", foreground: "#080c12" },
        popover: { DEFAULT: "#0d1320", foreground: "rgba(255,255,255,0.9)" },
        card: { DEFAULT: "rgba(255,255,255,0.035)", foreground: "rgba(255,255,255,0.9)" },
        // keep lightblue for backward compat with existing ui/ components
        lightblue: {
          50:"#f0f9ff",100:"#e0f2fe",200:"#bae6fd",300:"#7dd3fc",
          400:"#38bdf8",500:"#0ea5e9",600:"#0284c7",700:"#0369a1",
          800:"#075985",900:"#0c4a6e",950:"#082f49",
        },
        navbar: "#080c12",
        green: { DEFAULT:"#00ff88", dim:"rgba(0,255,136,0.12)", dark:"#00cc6a" },
        eth: "#627EEA",
        deth: "#22D3EE",
        seth: "#C084FC",
        gain: "#34D399",
        loss: "#F87171",
      },
      fontFamily: {
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        display: ["Clash Display", "sans-serif"],
        mono:    ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from:{height:"0"}, to:{height:"var(--radix-accordion-content-height)"} },
        "accordion-up":   { from:{height:"var(--radix-accordion-content-height)"}, to:{height:"0"} },
        "fade-up":        { from:{opacity:"0",transform:"translateY(12px)"}, to:{opacity:"1",transform:"translateY(0)"} },
        "float":          { "0%,100%":{transform:"translateY(0)"}, "50%":{transform:"translateY(-6px)"} },
        "pulse-green":    { "0%,100%":{boxShadow:"0 0 20px rgba(0,255,136,0.1)"}, "50%":{boxShadow:"0 0 40px rgba(0,255,136,0.25)"} },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 0.4s ease forwards",
        "float":          "float 4s ease-in-out infinite",
        "pulse-green":    "pulse-green 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
