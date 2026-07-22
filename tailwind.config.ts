import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf3",
          100: "#e0f6e3",
          200: "#c1ecc8",
          300: "#93dc9f",
          400: "#5dc571",
          500: "#38a852",
          600: "#288941",
          700: "#216d36",
          800: "#1e572e",
          900: "#194828",
        },
      },
    },
  },
  plugins: [],
};
export default config;
