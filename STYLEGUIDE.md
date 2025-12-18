# Style Guide

## Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#F59E0B` | Buttons, Highlights, Accents |
| **Primary Hover** | `#D97706` | Button Hover States |
| **Text Main** | `#111827` | Headings, Body Text |
| **Text Secondary** | `#4B5563` | Subheadings, Descriptions |
| **Background** | `#FFFFFF` | Cards, Main Content |
| **Background Alt** | `#F9FAFB` | Sections, Hovers |
| **Success** | `#10B981` | Positive Metrics |
| **Error** | `#EF4444` | Negative Metrics |

## Typography

**Font Family**: `Inter`, sans-serif

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **H1 (Hero)** | 2.5rem (Mobile) / 4rem (Desktop) | 800 | 1.1 |
| **H2 (Section)** | 2rem | 700 | 1.2 |
| **H3 (Card)** | 1.25rem | 600 | 1.4 |
| **Body** | 1rem | 400 | 1.5 |
| **Small** | 0.875rem | 400 | 1.5 |

## Spacing System

Based on a 4px grid.

- `xs`: 0.5rem (8px)
- `sm`: 1rem (16px)
- `md`: 1.5rem (24px)
- `lg`: 2rem (32px)
- `xl`: 4rem (64px)
- `xxl`: 6rem (96px)

## Components

### Buttons

- `.btn`: Base class
- `.btn--primary`: Solid orange background
- `.btn--secondary`: White background with border
- `.btn--outline`: Transparent with border

### Cards

- `.card`: White background, border, rounded corners, shadow.
- Modifiers: `.outcome-card`, `.pillar-card`, `.metric-card`.

### Grid System

- Uses CSS Grid `display: grid`.
- Responsive columns: 1 (mobile) -> 2 or 3 (desktop).
