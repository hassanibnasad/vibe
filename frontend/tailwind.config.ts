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
      sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      display: ["var(--font-display)", "Syne", "sans-serif"],
      mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
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
      "4xl": ["36px", { lineHeight: "42px" }],
      "5xl": ["48px", { lineHeight: "54px" }],
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
          foreground: "#FFFFFF",
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
        /* Shopify Editions Carbon & Mint scale */
        obsidian: {
          DEFAULT: "#09090B",
          50: "#18181B",
          100: "#111113",
          200: "#09090B",
        },
        carbon: "#111113",
        graphite: "#18181B",
        editions: {
          mint: "#00E599",
          emerald: "#008060",
          dark: "#052E20",
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
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        elevated: "0 4px 16px -2px rgba(0, 0, 0, 0.2)",
        glow: "0 0 20px rgba(0, 229, 153, 0.15)",
        "glow-lg": "0 0 40px rgba(0, 229, 153, 0.25)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
        fast: "120ms",
        normal: "180ms",
        slow: "250ms",
      },
    },
  },
  plugins: [],
};
export default config;
