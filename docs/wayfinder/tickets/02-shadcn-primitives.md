# Ticket 02: Shadcn UI Primitives Expansion & Radix Components

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 01: Design System Tokens & Global CSS Cleansing](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/01-design-tokens-and-css.md)  

## Question

What standard shadcn/ui components are required to replace all ad-hoc styling and provide accessible, density-ready primitives across the app?

## Implementation Plan

1. Audit and clean existing components:
   - `button.tsx`: Remove gradient variants (`variant="emerald"`, `variant="purple"`). Support `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`, with compact size `sm` and `icon`.
   - `badge.tsx`: Clean semantic variants (`default`, `secondary`, `outline`, `destructive`, plus subtle status badges for `success`, `warning`, `info`).
   - `card.tsx`: Tighten paddings, remove heavy drop-shadows, use flat subtle borders (`border-border`).
   - `input.tsx` & `textarea.tsx`: Add focus-visible rings (`ring-ring`), persistent border tokens.
   - `tabs.tsx`: Ensure clean segmented control styling.
2. Scaffold missing primitives in `frontend/src/components/ui/`:
   - `table.tsx`: Clean data table component (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`).
   - `dialog.tsx`: Modal dialog wrapper around `@radix-ui/react-dialog`.
   - `sheet.tsx`: Slide-over drawer wrapper around `@radix-ui/react-dialog`.
   - `dropdown-menu.tsx`: Context/action menu wrapper around `@radix-ui/react-dropdown-menu`.
   - `tooltip.tsx`: Accessible tooltips around `@radix-ui/react-tooltip`.
   - `skeleton.tsx`: Pulse loading placeholders.
   - `separator.tsx`: Semantic dividers around `@radix-ui/react-separator`.
   - `scroll-area.tsx`: Styled scroll container around `@radix-ui/react-scroll-area`.
   - `label.tsx`: Accessible form labels.
