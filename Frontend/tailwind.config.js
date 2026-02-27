/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f2ff",
          100: "#b3d9ff",
          200: "#80c0ff",
          300: "#4da7ff",
          400: "#1a8eff",
          500: "#3399cc",
          600: "#2670a3",
          700: "#1a4d7a",
          800: "#0d2a51",
          900: "#000728",
        },
      },
    },
  },
  plugins: [],
};
