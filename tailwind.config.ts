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
        teal: {
          DEFAULT: "#0D3F48",
          deep: "#082A30",
        },
        plum: {
          DEFAULT: "#5F304B",
          deep: "#3F1F32",
        },
        eggshell: {
          DEFAULT: "#F3F0E7",
          warm: "#ECE7D8",
          line: "#E6E1D2",
        },
        lime: "#E3F29C",
        lavender: "#E8DDFF",
        fg: {
          DEFAULT: "#0D3F48",
          muted: "#4A6A70",
          subtle: "#7A9098",
        },
      },
      fontFamily: {
        serif: ["var(--font-source-serif)", "Iowan Old Style", "Georgia", "serif"],
        script: ["var(--font-biro-script)", "Kalam", "Caveat", "cursive"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Inter", "sans-serif"],
      },
      maxWidth: {
        site: "1320px",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        ttgScroll: {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(227, 242, 156, 0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(227, 242, 156, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(227, 242, 156, 0)" },
        },
        commFade: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        revealUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 44s linear infinite",
        "ttg-scroll": "ttgScroll 60s linear infinite",
        pulse: "pulse 2s infinite",
        "comm-fade": "commFade 0.25s ease",
        "reveal-up": "revealUp 0.7s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
