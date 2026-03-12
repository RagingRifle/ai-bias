/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slateDeep: "#0f172a",
        slateMid: "#1e293b",
        slateSoft: "#334155",
        accent: "#3b82f6",
        accentGlow: "#2563eb",
        animation: {
          reveal: "reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        },
        keyframes: {
          reveal: {
            "0%": {
              opacity: 0,
              transform: "translateY(12px)",
              filter: "blur(6px)"
            },
            "60%": {
              opacity: 0.6,
              filter: "blur(2px)"
            },
            "100%": {
              opacity: 1,
              transform: "translateY(0)",
              filter: "blur(0)"
            }
          }
        },
      },
    },
  },
  plugins: [],
}