# Ticket 01: Design System Tokens & Global CSS Cleansing

**Type**: `wayfinder:task`  
**Status**: `frontier`  
**Blocked by**: None  

## Question

How do we restructure `globals.css` and `tailwind.config.ts` to establish an enterprise-grade Slate/Zinc token system, eliminate all decorative glow effects, neon borders, and hardcoded colors, and configure a crisp typography and elevation system?

## Implementation Plan

1. Clean `frontend/src/app/globals.css`:
   - Define canonical HSL color variables for dark mode (and light mode readiness): `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius: 0.375rem`.
   - Remove `.glow-purple`, `.glow-emerald`, `.glow-amber`, and `.glass-panel`.
   - Add sleek, non-distracting scrollbar styles and standard focus visible utilities.
2. Update `frontend/tailwind.config.ts`:
   - Map all semantic CSS variables to Tailwind colors (`background`, `foreground`, `border`, `card`, etc.).
   - Configure crisp border radius tokens (`sm: calc(var(--radius) - 2px)`, `md: var(--radius)`, `lg: calc(var(--radius) + 2px)`).
   - Configure typography scale suitable for compact data density.
