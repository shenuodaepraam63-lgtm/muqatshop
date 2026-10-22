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
        page: "#FFFCEE",
        card: "#ede9d9",
        ink: "#101010",
        muted: "#666666",
        sale: "#f2627b",
        accent: "#0042EB",
        border: "#e5e5e5",
      },
      fontFamily: {
        sans: ["var(--font-changa)", "system-ui", "sans-serif"],
        display: ["var(--font-changa)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        media: "16px",
        btn: "40px",
      },
      maxWidth: {
        page: "1800px",
      },
      boxShadow: {
        header: "0 4px 20px rgba(13, 13, 18, 0.06), 0 1px 2px rgba(13, 13, 18, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
