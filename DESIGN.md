---
name: Cognito Workspace (Editorial Workspace)
description: A clean, ultra-minimalist, document-style workspace with warm monochrome tones and high-contrast typography.
colors:
  primary: "#111111"
  neutral-bg: "#FBFBFA"
  neutral-surface: "#F7F6F3"
  neutral-border: "#EAEAEA"
  text-muted: "#787774"
  tag-blue-bg: "#E1F3FE"
  tag-blue-text: "#1F6C9F"
  tag-yellow-bg: "#FBF3DB"
  tag-yellow-text: "#956400"
  tag-green-bg: "#EDF3EC"
  tag-green-text: "#346538"
typography:
  display:
    fontFamily: "Newsreader, Lyon Text, serif"
    fontWeight: 400
    letterSpacing: "-0.03em"
    lineHeight: 1.05
  body:
    fontFamily: "SF Pro Display, Geist Sans, sans-serif"
    fontSize: "18px"
    lineHeight: 1.6
  mono:
    fontFamily: "Geist Mono, JetBrains Mono, monospace"
    fontSize: "12px"
rounded:
  sm: "6px"
  md: "12px"
spacing:
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
---

# Design System: Cognito Workspace (Editorial Workspace)

## Overview

**Creative North Star: "The Editorial Workspace"**

An ultra-minimalist, high-end "document-style" web interface analogous to top-tier workspace platforms like Notion or Craft. This system relies heavily on macro-whitespace, strict 1px borders, and a stark typographic contrast between editorial serifs and clean geometric sans-serifs.

**Key Characteristics:**

- Warm monochrome: avoiding pure clinical white or harsh dark modes.
- Muted pastels: color is used exceptionally sparingly, only in status tags or semantic blocks.
- Flat bento grids: no heavy drop shadows, no glassmorphism.

## Colors

### Primary

- **Charcoal Ink** (#111111): Primary text, primary buttons.
- **Muted Slate** (#787774): Explanatory text, secondary elements.

### Neutral

- **Warm Bone** (#FBFBFA): Primary canvas.
- **Soft Sand** (#F7F6F3): Secondary surface areas.
- **Hairline Gray** (#EAEAEA): Universal 1px border color.

### Semantic Pastels

- **Pale Blue** (#E1F3FE bg / #1F6C9F text)
- **Pale Yellow** (#FBF3DB bg / #956400 text)
- **Pale Green** (#EDF3EC bg / #346538 text)

## Typography

**Display Font:** Editorial Serif (e.g., Newsreader)
**Body Font:** Clean Sans-Serif (e.g., Geist Sans)
**Meta Font:** Monospace (e.g., Geist Mono)

### Hierarchy

- **Display** (400, tight tracking): Used strictly for Hero and massive H2s.
- **Body** (400, 18px): Generous line-height for readability.

## Layout

Strict bento grids with exact 1px `#EAEAEA` borders. Modest border radii (6px to 12px). No massive pill shapes or circle containers.

## Elevation & Depth

Shadows are almost non-existent. A micro-shadow (`0 2px 8px rgba(0,0,0,0.02)`) is applied to major app window containers just to separate them from the background, but standard cards are flat.

## Do's and Don'ts

### Do:

- **Do** use `<kbd>` tags for keystrokes in a monospace font.
- **Do** rely on generous macro-whitespace (e.g. `py-32`) to give content room to breathe.

### Don't:

- **Don't** use primary colored backgrounds for large sections.
- **Don't** use generic thin-line icon libraries; stick to solid typography.
