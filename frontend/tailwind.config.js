/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        peach: "#ffedd5",
        coral: "#fb7185",
        mint: "#a7f3d0",
        ocean: "#0ea5e9",
        sand: "#f8fafc",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(14, 165, 233, 0.18)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
