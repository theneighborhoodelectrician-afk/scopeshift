import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        ember: "#c96a1b",
        mist: "#eef2f4",
        slate: "#52606d",
        pine: "#165d4a"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(16, 20, 24, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
