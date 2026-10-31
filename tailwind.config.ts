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
        page: "#FAF7F2",
        card: "#FFFFFF",
        surface: "#FFFFFF",
        "surface-2": "#F3EEE6",
        ink: "#0C0A09",
        "ink-soft": "#44403C",
        muted: "#78716C",
        sale: "#E11D48",
        accent: "#1C1917",
        brand: "#8B5E34",
        "brand-dark": "#6B4423",
        gold: "#C4A574",
        success: "#059669",
        border: "#E7E0D6",
      },
      fontFamily: {
        sans: ["var(--font-changa)", "system-ui", "sans-serif"],
        display: ["var(--font-changa)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        media: "16px",
        btn: "12px",
        card: "18px",
      },
      maxWidth: {
        page: "1800px",
      },
      boxShadow: {
        header:
          "0 1px 0 rgba(12,10,9,0.04), 0 4px 16px rgba(12,10,9,0.05)",
        card: "0 1px 2px rgba(12,10,9,0.04), 0 8px 24px rgba(12,10,9,0.06)",
        soft: "0 2px 12px rgba(12,10,9,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
