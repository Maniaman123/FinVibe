---
name: FinVibe Ecosystem
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8083ff'
  on-tertiary-container: '#0d0096'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

# FinVibe Ecosystem — Design System & Documentation

## Brand & Style

This design system is engineered for the modern MSME (UMKM) landscape, merging the precision of financial auditing with the forward-leaning aesthetic of artificial intelligence. The style is **Corporate Modern** with a **High-Tech AI** edge, utilizing a "Dark Mode First" philosophy to reduce cognitive load during long sessions of data analysis.

The visual language communicates three core values:
1. **Intelligence:** Subtle glow effects and vibrant accents signify AI-driven insights.
2. **Stability:** A rigid grid and structured containers reassure the user of financial accuracy.
3. **Clarity:** High-contrast typography and generous negative space ensure that complex data remains actionable.

The interface leverages deep, monochromatic backgrounds paired with vivid, luminescent accents to guide the user's eye toward critical financial trends and automated recommendations.

## Colors

The palette is rooted in a "Rich Black" foundation to provide maximum depth and contrast for data visualization.

* **Primary (AI Accent):** A vibrant Violet-400/Indigo-600 blend (`#d0bcff`) used for primary actions, active navigation states, and AI-generated insights. It represents the "intelligence" layer of the product.
* **Secondary (Success/Growth):** Emerald-400 (`#4edea3`) is reserved for positive financial indicators, upward trends, and completed transactions.
* **Neutral/Background:** The base uses Surface/Background (`#131315`) for the canvas, and Surface Container Low (`#1c1b1d`) / Surface Container (`#201f22`) for containers. This structured tonal separation provides hierarchy without needing heavy shadows.
* **Typography:** On-Surface (`#e5e1e4`) provides crisp readability for headings and financial figures, while On-Surface Variant (`#cbc3d7`) or Outline (`#958ea0`) is used for metadata, labels, and secondary information to maintain a clean visual hierarchy.

## Typography

The typographic system utilizes a trio of typefaces to distinguish between branding, interface, and data.

* **Geist** is used for headlines and primary numbers. Its technical, minimalist structure reinforces the AI-driven nature of the dashboard.
* **Hanken Grotesk** serves as the primary body face. It is exceptionally legible at small sizes, making it ideal for dense financial reports and descriptions.
* **JetBrains Mono** is utilized sparingly for labels, transaction IDs, and specific financial data points where a "monospaced" feel adds to the sense of precision and technical reliability.

> ⚠️ **Font Implementation Note:** To prevent the system from falling back to default system fonts (like Arial or Times New Roman), ensure that custom web fonts are properly imported into the Stitch project platform or your React index file via Google Fonts or `@font-face` rules.
>
> For Tailwind CSS implementation, place these imports at the top of your main stylesheet:
> ```css
> @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
> /* Note: Ensure Geist font is either self-hosted or pulled via an active font CDN */
> ```

**Scaling:** On mobile devices, display and large headline sizes should scale down by 15-20% to maintain readability without excessive wrapping.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop environments, transitioning to a **4-column grid** for mobile.

* **Dashboard Logic:** The sidebar is fixed at 280px on desktop. The main content area uses a dynamic flex layout with a maximum container width of 1440px to prevent excessive line lengths.
* **Rhythm:** An 8px linear scale is used for most spacing (8, 16, 24, 32), while 4px increments are reserved for tight component internals (e.g., button icons, checkbox alignment).
* **Hierarchy:** Large cards (Charts, Cash Flow) should use `lg` (24px) padding, while smaller utility chips and table cells use `sm` (12px) padding to maximize data density.

## Elevation & Depth

In this dark-themed environment, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

1. **Level 0 (Canvas):** Surface Background (`#131315`). The deepest layer.
2. **Level 1 (Cards/Sidebar):** Surface Container Low (`#1c1b1d`) or Surface Container (`#201f22`). Raised slightly with a `1px` solid border of Outline Variant (`#494454`).
3. **Level 2 (Modals/Popovers):** Surface Container High (`#2a2a2c`). These elements use a subtle ambient shadow (Black, 40% opacity, 20px blur) to separate them from the card layer.

**AI Highlighting:** Elements requiring "AI Focus" (like a suggested insight) utilize a very subtle 2px outer glow using the primary Indigo color at 10% opacity, creating a "soft pulse" effect.

## Shapes

The shape language is **Rounded**, striking a balance between the friendliness of a modern startup and the professional rigor of a financial institution.

* **Standard Components:** Buttons, Input Fields, and Checkboxes use the base `0.5rem` (8px) radius.
* **Containers:** Main dashboard cards and modal windows use `1rem` (16px) radius to create a softer, more modern framing for complex charts.
* **Interactive Tags:** Elements like status badges or chips use a fully rounded `pill-shape` to distinguish them from actionable buttons.

## Components

### Buttons
* **Primary:** Solid Primary (`#d0bcff`) background with dark On-Primary (`#3c0091`) text. Subtle hover state transitions to a slightly brighter shade.
* **Secondary:** Ghost style. Transparent background with Outline (`#958ea0`) border and On-Surface (`#e5e1e4`) text.
* **AI Action:** Primary button with a subtle `linear-gradient` (Indigo to Violet) and a "sparkle" icon.

### Input Fields
* **Default:** Surface Container Low (`#1c1b1d`) background, Outline Variant (`#494454`) border. On focus, the border transitions to Primary (`#d0bcff`) with a 1px solid weight.
* **Labels:** Always use `label-md` (JetBrains Mono) for field headers to give a technical, precise feel.

### Cards & Charts
* All cards must feature a `1px` border of Outline Variant (`#494454`).
* Chart axes should use subtle lines with On-Surface Variant (`#cbc3d7`) text for labels.

### Data Tables
* **Header:** Surface Container (`#201f22`) background with sticky positioning.
* **Rows:** Transparent background with a `1px` bottom border of Surface Container Low (`#1c1b1d`). Hover state: Surface Container High (`#2a2a2c`).

### AI Coach Widget
* A persistent, floating or docked element. Use a glassmorphism effect (Backdrop blur 12px) with a semi-transparent dark container and a vibrant Primary (`#d0bcff`) or Secondary (`#4edea3`) icon.