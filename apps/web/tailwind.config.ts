import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        white: "#FFFFFF",
        black: "#000000",
        "secondary-white": "#F7F9FA",
        "secondary-black": "#353B3F",
        "primary-gray": "#6D777C",
        "secondary-gray": "#C3C8CC",
        "tertiary-gray": "#E1E2E2",
        stroke: "#D7DCDE",
        "stroke-secondary": "#EAEDF0",
        red: "#EE2020",
        facebook: "#1877F2",
        venmo: "#008CFF",
        success: "#74E04033",
        "success-stroke": "#74E040",
        warning: "#FF9A3D33",
        "warning-stroke": "#FF9A3D",
        error: "#E0407033",
        "alert-red": "#EE2020",
        "error-stroke": "#E04070",
      },
      boxShadow: {
        "overflow-indicator": "0px 4px 24px 0px rgba(0, 0, 0, 0.3)",
        "google-btn": "0px 2px 3px 0px rgba(0, 0, 0, 0.168) ",
        outline: "0px 0px 3px 0px rgba(0, 0, 0, 0.084)",
      },
      fontWeight: {
        semibold: "400",
      },
      animation: {
        slideDown: "slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)",
        slideUp: "slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)",
        "spin-fast": "spin .5s linear infinite",
      },
      keyframes: {
        slideDown: {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        slideUp: {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
