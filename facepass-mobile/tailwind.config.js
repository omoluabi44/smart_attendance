/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        blue: {
          50: "#EBF5FF",
          100: "#D6EAFF",
          200: "#ADD5FF",
          300: "#70B5FF",
          400: "#3395FF",
          500: "#007BFF",
          600: "#0069D9",
          700: "#0052AD",
          800: "#003D82",
          900: "#002957",
          950: "#001530",
        },
        obsidian: {
          950: "#050B16",
          900: "#081121",
          800: "#0D1B33",
          700: "#162A4A",
        },
        vision: {
          blue: "#007BFF",
          cyan: "#00B4D8",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#F43F5E",
        },
        bases: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
