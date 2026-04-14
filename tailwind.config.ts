import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accept: "#10b981",
        review: "#f59e0b",
        reject: "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;
