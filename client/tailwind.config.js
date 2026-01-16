/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-main": "#0f172a",
        "bg-sidebar": "#1e293b",
        surface: "#1e293b",
        "border-color": "#334155",
        "text-primary": "#f8fafc",
        "text-secondary": "#94a3b8",
        accent: "#818cf8",
        "accent-hover": "#6366f1",
        danger: "#f87171",
      },
      animation: {
        wiggle: "wiggle 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow-reverse": "spin 8s linear infinite reverse",
        "bounce-slow": "bounce 3s infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-10deg)" },
          "50%": { transform: "rotate(10deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
