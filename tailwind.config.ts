import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kali: {
          orange: "#F36E0F",
          "orange-hover": "#ea580c",
          dark: "#0D0D2B",
          "dark-accent": "#1A1A40",
          card: "#0e1b4d",
          header: "#1b2a7a",
          bubble: "#2a3c91",
          secondary: "#17102D",
          deep: "#060c1e",
          wine: "#401a1d",
        },
      },
      backgroundImage: {
        "kali-support": "linear-gradient(to bottom right, #0D0D2B, #1A1A40)",
        "kali-home": "linear-gradient(to right, #401a1d, #0a0221)",
        "kali-games": "linear-gradient(to bottom, #0c1a66, #060c1e)",
        "kali-gold": "linear-gradient(to right, #F6FF00, #EA0000)",
      },
    },
  },
  plugins: [],
};
export default config;
