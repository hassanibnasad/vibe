import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      display: ["var(--font-display)", "Georgia", "serif"],
      mono: ["var(--font-mono)", "ui-monospace", "monospace"],
    },
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["13px", { lineHeight: "18px" }],
      base: ["14px", { lineHeight: "20px" }],
      md: ["15px", { lineHeight: "22px" }],
      lg: ["16px", { lineHeight: "24px" }],
      xl: ["18px", { lineHeight: "24px" }],
      "2xl": ["22px", { lineHeight: "28px" }],
      "3xl": ["28px", { lineHeight: "34px" }],
      "4xl": ["36px", { lineHeight: "40px" }],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        canvas: "hsl(var(--canvas))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          elevated: "hsl(var(--surface-elevated))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--status-danger))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          disabled: "hsl(var(--text-disabled))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        status: {
          draft: "hsl(var(--status-draft))",
          scheduled: "hsl(var(--status-scheduled))",
          published: "hsl(var(--status-published))",
          failed: "hsl(var(--status-danger))",
          success: "hsl(var(--status-published))",
          warning: "hsl(var(--status-warning))",
          danger: "hsl(var(--status-danger))",
          error: "hsl(var(--status-danger))",
          info: "hsl(var(--status-scheduled))",
        },
        /* Warm surrealism accent colors */
        terracotta: {
          DEFAULT: "#E07830",
          50: "#FEF3EB",
          100: "#FDDBC2",
          200: "#F6B888",
          300: "#EE914E",
          400: "#E07830",
          500: "#CC5C1A",
          600: "#A64A15",
          700: "#7F3810",
          800: "#59270B",
          900: "#321606",
        },
        ochre: {
          DEFAULT: "#C4922A",
          400: "#D4A83E",
          500: "#C4922A",
          600: "#A07620",
        },
        sienna: {
          DEFAULT: "#8B4513",
          400: "#A0562A",
          500: "#8B4513",
          600: "#6B3410",
        },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.06)",
        elevated: "0 4px 16px -2px rgba(0, 0, 0, 0.12)",
        warm: "0 4px 20px -2px rgba(224, 120, 48, 0.08)",
        "warm-lg": "0 8px 30px -4px rgba(224, 120, 48, 0.12)",
        glow: "0 0 20px rgba(224, 120, 48, 0.15)",
        "glow-lg": "0 0 40px rgba(224, 120, 48, 0.2)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        luxurious: "500ms",
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "warm-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "float": "float 25s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
        "warm-pulse": "warm-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
