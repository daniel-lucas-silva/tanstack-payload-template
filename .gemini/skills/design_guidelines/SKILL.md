---
name: "frontend-design"
description: >
  Provides design recipes for typography, color, spacing, layout, and
  interaction that produce polished, distinctive frontend interfaces. Use when
  building any web app, website, dashboard, landing page, game, component, or
  user-facing UI. Also use when styling, beautifying, or improving the visual
  design of existing frontend code. Covers 12 complete aesthetic recipes, game
  development guidelines, and common anti-patterns to avoid.
---

# Frontend Design & UX Guidelines

Good design comes from **intentional pairings**—not defaults. The difference
between "AI slop" and a crafted interface is whether typography, color, spacing,
and interaction reinforce the same mood. This section provides **Design
Recipes**: complete examples showing how these elements combine. Use them as
inspiration and adapt to your context.

## Design Recipes

Each recipe below demonstrates a complete aesthetic. Study how the CSS
variables, typography choices, layout patterns, and interaction details work
together. These are starting points—combine and adapt them for your specific
application.

--------------------------------------------------------------------------------

### Recipe 1: Technical Dashboard / Data Grid

**Mood:** Professional, precise, information-dense. Feels like mission control
or a scientific instrument.

**When to use:** Analytics dashboards, monitoring tools, data-heavy
applications, developer tools, admin panels.

**Why it works:** The visible grid structure creates rhythm and scannable
columns. Italic serif headers add a human touch to counter the coldness of data.
Monospace fonts signal "raw data" and create alignment. The muted secondary text
reduces noise while keeping information accessible.

```css
:root {
  --bg: #E4E3E0;
  --ink: #141414;
  --line: #141414;
  --f-mono: 'Courier New', Courier, monospace;
  --f-sans: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* Visible grid borders—don't hide the structure, celebrate it */
.data-row {
  display: grid;
  grid-template-columns: 40px 1.5fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

/* Invert on hover—creates strong interactive feedback */
.data-row:hover {
  background: var(--ink);
  color: var(--bg);
}

/* Italic serif column headers—humanizes the data */
.col-header {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 11px;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Monospace for data values—signals precision */
.data-value {
  font-family: var(--f-mono);
  letter-spacing: -0.02em;
}
```

--------------------------------------------------------------------------------

### Recipe 2: Editorial / Magazine Hero

**Mood:** Bold, dramatic, attention-grabbing. Feels like a fashion magazine
cover or exhibition poster.

**When to use:** Landing pages, hero sections, portfolios, event pages, travel
apps, content-heavy sites with strong imagery.

**Why it works:** Massive typography at 24vw+ creates immediate visual impact.
The tight line-height (0.82-0.9) and negative letter-spacing make large text
feel dense and intentional rather than bloated. Skewed transforms add dynamism.
The contrast between enormous display type and tiny uppercase micro-labels
creates clear hierarchy.

```css
:root {
  --c-bg: #050505;
  --c-accent: #F27D26; /* Warm orange for dark backgrounds */
  --f-display: 'Anton', sans-serif;
  --f-body: 'Inter', sans-serif;
}

/* Massive display typography—commands attention */
h1 {
  font-family: var(--f-display);
  font-size: 24vw;
  line-height: 0.82;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

/* Micro-labels—contrast against the massive type */
.meta-label {
  font-family: var(--f-body);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.7;
}

/* Skewed container—adds dynamism */
.title-wrapper {
  transform: skewX(-10deg);
}

/* Slam-in animation—dramatic entry */
@keyframes slamIn {
  0% { transform: scale(2) translateY(-100px) skewX(-10deg); opacity: 0; }
  100% { transform: scale(1) translateY(0) skewX(-10deg); opacity: 1; }
}
```

--------------------------------------------------------------------------------

### Recipe 3: Hardware / Specialist Tool

**Mood:** Technical, focused, professional-grade. Feels like audio equipment, a
synthesizer, or scientific instrument.

**When to use:** Audio/music apps, recording tools, monitoring widgets, any
specialist tool that benefits from a "hardware" feel.

**Why it works:** Dark backgrounds with muted secondary text reduce eye strain
for focused work. Dashed borders and radial elements evoke physical equipment.
The recording state with glow creates clear active/inactive distinction.
Monospace timecodes feel authentic. The contained "widget" format suggests a
physical device.

```css
:root {
  --bg-color: #E6E6E6; /* Light surround */
  --card-bg: #151619; /* Dark matte widget */
  --text-primary: #FFFFFF;
  --text-secondary: #8E9299;
  --mono-font: 'JetBrains Mono', 'Roboto Mono', monospace;
}

/* Widget container—feels like physical hardware */
.widget-container {
  width: 380px;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

/* Dashed radial track—evokes physical equipment */
.radial-track {
  border: 1px dashed var(--text-secondary);
  border-radius: 50%;
}

/* Recording state glow—clear active feedback */
.is-recording .trigger-icon {
  background-color: #FF4444;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.4);
}

/* Monospace timecode—authentic data display */
.timer-display {
  font-family: var(--mono-font);
  font-size: 11px;
  letter-spacing: 1px;
}

/* Micro-labels for status */
.status-label {
  font-family: var(--mono-font);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
}
```

--------------------------------------------------------------------------------

### Recipe 4: Dark Luxury / Travel

**Mood:** Sophisticated, minimal, premium. Feels like a high-end travel
concierge or luxury brand.

**When to use:** Travel apps, booking interfaces, premium services, content
showcasing beautiful imagery.

**Why it works:** Pure black background makes imagery pop and feels exclusive.
Extremely light font weights (300) feel refined rather than bold. Thin pill
borders create interactive elements without visual weight. The consistent use of
tiny uppercase labels with wide tracking creates a cohesive system. Horizontal
divider lines create structure without heaviness.

```css
body {
  font-family: 'Inter', sans-serif;
  background-color: #000;
  color: #fff;
}

/* Massive light-weight display type—refined, not bold */
.title-text {
  font-size: 80px;
  line-height: 0.9;
  font-weight: 300; /* Very light */
  letter-spacing: -1px;
}

/* Pill navigation—bordered, not filled */
.nav-pill {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 100px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 400;
  background: transparent;
}

/* Consistent micro-labels throughout */
.small-caps {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* Subtle dividers—structure without heaviness */
.horizontal-line {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}

/* Circle action button—premium touch */
.circle-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

--------------------------------------------------------------------------------

### Recipe 5: Brutalist / Creative Tool

**Mood:** Bold, unconventional, creative. Feels like a design tool, creative
agency, or experimental interface.

**When to use:** Creative tools, design apps, portfolio sites, any interface
that should feel innovative or boundary-pushing.

**Why it works:** Neon accent on white creates high-energy contrast. Numbered
columns (01, 02, 03) add structure while feeling systematic. The marquee
animation creates motion and energy. Thick borders on white feel graphic and
intentional. Big sans-serif numbers dominate the hierarchy.

```css
:root {
  --neon-green: #00FF00;
  --brutal-black: #000000;
  --gallery-white: #FFFFFF;
  --font-display: 'Anton', sans-serif;
  --font-body: 'Inter', sans-serif;
}

/* Numbered section headers—systematic feel */
.big-number {
  font-family: var(--font-display);
  font-size: 5rem;
  line-height: 0.8;
}

/* Marquee animation—adds energy */
.marquee-track {
  display: flex;
  animation: marquee 20s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Neon accent buttons */
.action-btn:hover {
  background: var(--neon-green);
  color: var(--brutal-black);
}

/* Thick single-line borders—graphic, intentional */
.control-column {
  border-right: 1px solid var(--brutal-black);
  padding: 24px;
}

/* Uppercase labels throughout */
.input-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
}
```

--------------------------------------------------------------------------------

### Recipe 6: Warm Organic / Cultural

**Mood:** Approachable, refined, human. Feels like a boutique service, cultural
experience, or artisanal brand.

**When to use:** Cultural apps, hospitality services, lifestyle brands, anything
that should feel warm and personal rather than corporate.

**Why it works:** Serif fonts (Cormorant Garamond, Libre Baskerville) feel
classic and refined. Muted earth-tone accents (olive, cream) feel natural.
Pill-shaped images create visual interest without harsh edges. Large rounded
corners (32px) feel soft. The underline-with-offset pattern for active states is
subtle but clear.

```css
body {
  font-family: 'Cormorant Garamond', serif;
  background-color: #f5f5f0; /* Warm off-white */
}

/* Olive accent—warm, natural */
.olive-button {
  background-color: #5A5A40;
  color: white;
  border-radius: 9999px;
  padding: 12px 24px;
  letter-spacing: 0.5px;
}

/* Pill-shaped images—soft, organic */
.pill-image {
  border-radius: 9999px;
  aspect-ratio: 3/4;
  object-fit: cover;
}

/* Large rounded cards—feels soft */
.card {
  background-color: #FFFFFF;
  border-radius: 32px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
}

/* Active tab with offset underline */
.period-tab.active {
  text-decoration: underline;
  text-underline-offset: 8px;
}
```

--------------------------------------------------------------------------------

### Recipe 7: Atmospheric / Immersive Media

**Mood:** Dreamy, immersive, cinematic. Feels like a music player, meditation
app, or storytelling experience.

**When to use:** Music/audio apps, meditation, storytelling, any full-screen
immersive experience.

**Why it works:** Layered radial gradients create depth and atmosphere. The blur
filter (60px+) makes backgrounds feel ethereal. Glass morphism (backdrop-filter
blur + semi-transparent background) creates floating UI elements. Serif fonts
for content (lyrics, quotes) feel literary. The gradient mask on scrolling
content creates fade-in/fade-out edges.

```css
:root {
  --color-bg: #0a0502;
  --color-accent: #ff4e00;
  --glass-surface: rgba(255, 80, 20, 0.15);
  --glass-border: rgba(255, 200, 150, 0.1);
  --font-serif: 'Georgia', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Atmospheric background—layered gradients */
.atmosphere {
  background:
    radial-gradient(circle at 50% 30%, #3a1510 0%, transparent 60%),
    radial-gradient(circle at 10% 80%, var(--color-accent) 0%, transparent 50%);
  filter: blur(60px);
  opacity: 0.82;
}

/* Glass morphism player chrome */
.player-chrome {
  background: var(--glass-surface);
  backdrop-filter: blur(30px);
  border-radius: 32px;
  border: 1px solid var(--glass-border);
}

/* Serif for literary content */
.lyric-content {
  font-family: var(--font-serif);
  font-size: 22px;
  line-height: 1.6;
  color: rgba(224, 216, 208, 0.6);
}

/* Active line highlight */
.lyric-content p.active {
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

/* Gradient mask for scroll fade */
.lyric-viewport {
  mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
}
```

--------------------------------------------------------------------------------

### Recipe 8: Clean Utility / Minimal

**Mood:** Clean, functional, trustworthy. Feels like a well-designed utility app
or fintech product.

**When to use:** Finance apps, utility dashboards, any tool where clarity and
trust are paramount.

**Why it works:** System fonts (SF Pro, -apple-system) feel native and
trustworthy. Light gray backgrounds (#f5f5f5) are easy on eyes. Large rounded
corners on cards (24px+) feel modern. Simple percentage displays with light font
weights feel data-focused without being clinical. Dot-matrix visualizations add
visual interest while staying minimal.

```css
body {
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f5f5f5;
}

/* Large percentage display—data-focused */
.big-stat {
  font-size: 3rem;
  font-weight: 300; /* Light */
}

/* Rounded cards—modern utility */
.card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* Dot chart visualization */
.dot-chart {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 2px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #d1d1d1;
}

.dot.active {
  background-color: #4a4a4a;
}

/* Muted secondary text */
.text-muted {
  color: #9e9e9e;
  font-size: 0.875rem;
}
```

--------------------------------------------------------------------------------

### Recipe 9: Oversized Typographic / Calendar

**Mood:** Bold, organized, striking. Feels like a designer calendar or timeline
interface.

**When to use:** Calendar apps, fitness tracking, habit trackers, any interface
organized by time periods.

**Why it works:** Oversized serif numbers (Playfair Display at 120px) create
instant visual anchors. Vertical month labels (writing-mode: vertical-rl)
maximize horizontal space for content. The number partially overlaps content,
creating depth. Simple line borders between sections create clear separation
without heaviness.

```css
body {
  font-family: 'Inter', sans-serif;
  background-color: #f5f5f5;
}

/* Oversized numbers—visual anchors */
.oversized-number {
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  font-size: 120px;
  line-height: 0.8;
}

/* Vertical month labels */
.month-label {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  padding: 4px 8px;
  background: #f0f0f0;
}

/* Section borders—clean separation */
.section {
  border-bottom: 1px solid #e5e5e5;
  position: relative; /* For overlapping number */
}

/* Number overlaps content for depth */
.oversized-number {
  position: absolute;
  top: 0;
  left: 8px;
  z-index: 10;
}
```

--------------------------------------------------------------------------------

### Recipe 10: Bold Background Color / List

**Mood:** Energetic, playful, memorable. Feels like a travel bucket list or
inspiration board.

**When to use:** List-based apps, wishlists, travel planning, any interface that
should feel fun and aspirational.

**Why it works:** A single bold background color (#FF6321 orange, for example)
creates instant personality. Classic serif fonts (Libre Baskerville) on vibrant
backgrounds feel unexpected and memorable. Italic subtitles add variety. Thin
line dividers on busy backgrounds need reduced opacity (0.2) to not fight for
attention.

```css
body {
  font-family: 'Libre Baskerville', serif;
  background-color: #FF6321; /* Bold orange */
  color: #000000;
}

/* List items with subtle dividers */
.list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  padding: 12px 0;
}

/* Italic subtitles for variety */
.subtitle {
  font-style: italic;
}

/* Country tags—inline, subtle */
.country-tag {
  font-style: italic;
  font-size: 0.8em;
  opacity: 0.8;
}

/* Footer micro-details */
.footer-details {
  font-size: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  padding-top: 16px;
}
```

--------------------------------------------------------------------------------

### Recipe 11: SaaS Landing / Split Layout

**Mood:** Professional, confident, modern. Feels like a well-funded SaaS
product.

**When to use:** Product landing pages, SaaS marketing, any B2B interface.

**Why it works:** Split 50/50 layouts create visual balance and allow light/dark
contrast. Extremely large headline text (112px) with semi-bold weight commands
attention without feeling heavy. Floating circular elements with slight
rotations create visual interest and motion on static pages. Vertical rail text
uses space efficiently while adding graphic interest.

```css
:root {
  --color-paper: #f5f5f4;
  --color-ink: #0a0a0a;
  --font-sans: 'Inter', system-ui, sans-serif;
}

/* Split layout—contrast between panes */
main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
}

/* Massive headline—confident */
h1 {
  font-size: 112px;
  line-height: 0.88;
  letter-spacing: -0.02em;
  font-weight: 600;
}

/* Vertical rail text */
.rail-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  letter-spacing: 0.08em;
  font-size: 11px;
  text-transform: uppercase;
}

/* Floating feature bubbles */
.feature-bubble {
  border-radius: 9999px;
  background: white;
  outline: 1px solid var(--color-ink);
  padding: 20px;
  transform: rotate(-6deg);
}

/* Circular CTA */
.cta-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  outline: 1px solid var(--color-ink);
  display: grid;
  place-items: center;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.14em;
}
```

--------------------------------------------------------------------------------

### Recipe 12: Luxury / Prestige

**Mood:** Exclusive, refined, aspirational. Feels like a private members' club
or luxury asset marketplace.

**When to use:** High-end services, luxury goods, exclusive memberships, premium
real estate.

**Why it works:** Serif fonts (Cormorant Garamond) feel established and
trustworthy. Warm off-white backgrounds (#f5f2ed) feel more refined than pure
white. Oval-masked images feel distinctive and premium. Vertical text elements
add graphic sophistication. Grid navigation with thin borders feels systematic
and high-end.

```css
body {
  font-family: 'Montserrat', sans-serif;
  background-color: #f5f2ed; /* Warm off-white */
  color: #1a1a1a;
}

.serif {
  font-family: 'Cormorant Garamond', serif;
}

/* Oval image mask—distinctive */
.oval-mask {
  mask-image: url("data:image/svg+xml,...ellipse...");
  mask-size: contain;
}

/* Vertical text—graphic element */
.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
}

/* Grid navigation—systematic luxury */
.nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid rgba(26, 26, 26, 0.2);
}

.nav-item {
  padding: 16px 24px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-right: 1px solid rgba(26, 26, 26, 0.2);
}

/* Mixed-size typography */
h2 {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  font-size: 2rem;
  line-height: 1.2;
}

h2 .italic-small {
  font-size: 1.125rem;
  font-style: italic;
}
```

--------------------------------------------------------------------------------

## Combining Recipes

Real interfaces often combine elements from multiple recipes. For example:

-   **Technical + Editorial**: A data dashboard that uses massive typography for
    key metrics but data-grid patterns for detailed tables
-   **Dark Luxury + Atmospheric**: A premium music service with glass morphism
    controls
-   **Warm Organic + Minimal Utility**: A wellness app with serif typography but
    clean utility patterns for tracking

The key is **consistency within a section** while allowing contrast between
sections. Headers might be brutalist while content areas are minimal. A hero
section might be editorial while the rest is clean utility.

--------------------------------------------------------------------------------

## Common Anti-Patterns to Avoid

1.  **Generic purple/blue gradients** — These signal "AI-generated." Use
    intentional color palettes from the recipes above.
2.  **Default shadows on everything** — Use shadows sparingly and purposefully,
    or not at all.
3.  **Mixing too many font weights randomly** — Pick 2-3 weights and use them
    consistently.
4.  **Cards on gray backgrounds as the only layout** — Explore split panes,
    visible grids, and full-bleed sections.
5.  **Identical spacing everywhere** — Create rhythm through intentional
    variation in padding and margins.

--------------------------------------------------------------------------------

## SECTION 2: Game Development

If building a game, **IGNORE the recipes above** and follow these overrides:

### 2.1. Tech Stack & Rendering

-   **Canvas First**: For core gameplay, prefer `<canvas>` (via standard Web
    APIs or libraries if permitted) over DOM manipulation.
-   **Immersive UI**: HUDs and menus should fit the game's theme, often
    requiring custom assets or highly stylized CSS over standard "modern cards."

### 2.2. Animation & Game Loop

-   **Game Loop**: Use `requestAnimationFrame` for continuous, physics-based
    gameplay logic. Do NOT rely solely on CSS/Framer Motion for game mechanics.
-   **"Juice"**: Add exaggerated feedback for player actions (screen shake,
    particles) to improve game feel.

### 2.3. Responsiveness

-   **Scale to Fit**: The game view should often scale to fit the screen while
    maintaining its aspect ratio (letterboxing if necessary), rather than
    reflowing like a document.
