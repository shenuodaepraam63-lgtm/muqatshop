import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "#F6F8FB",
        card: "#FFFFFF",
        surface: "#FFFFFF",
        "surface-2": "#EEF1F6",
        ink: "#14243A",
        "ink-soft": "#202B3C",
        muted: "#718096",
        sale: "#E11D48",
        accent: "#14243A",
        brand: "#3157D5",
        "brand-dark": "#2447B8",
        gold: "#C4A574",
        success: "#21865B",
        border: "#E4E9F0",
        navy: "#14243A",
        blue: "#3157D5",
        teal: "#18A999",
      },
      fontFamily: {
        sans: [
          "var(--font-arabic)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-arabic)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        media: "16px",
        btn: "8px",
        card: "12px",
      },
      maxWidth: {
        page: "1800px",
      },
      boxShadow: {
        header:
          "0 1px 0 rgba(20,36,58,0.04), 0 4px 16px rgba(20,36,58,0.05)",
        card: "0 1px 2px rgba(20,36,58,0.04), 0 8px 24px rgba(20,36,58,0.06)",
        soft: "0 2px 12px rgba(20,36,58,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
