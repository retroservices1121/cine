# Design System Specification: The Cinematic Exchange

## 1. Overview & Creative North Star
**Creative North Star: "The Noir Ledger"**
This design system moves away from the sterile, data-heavy look of traditional fintech and adopts a high-end, editorial "Cinematic Noir" aesthetic. It treats prediction markets not just as data points, but as premiere events. 

The system breaks the traditional "dashboard template" by utilizing **intentional asymmetry** and **tonal layering**. We bypass the rigid grid in favor of overlapping elements and vast negative space, creating an interface that feels like a premium streaming platform or a luxury film program. The goal is to make every prediction feel like a high-stakes premiere.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep blacks and high-contrast accents, using Material Design tonal logic to create depth without visual clutter.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning or containment. 
Structure must be defined through:
- **Background Shifts:** Using `surface-container-low` against `surface`.
- **Negative Space:** Increasing padding to create "islands" of content.
- **Tonal Transitions:** Subtle value shifts that guide the eye naturally.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of luxury materials (obsidian, frosted glass, brushed steel).
- **Base Layer:** `surface` (#131313) for the main application background.
- **Sub-Sections:** Use `surface-container-low` (#1b1b1b) to define large content areas.
- **Interactive Elements:** Use `surface-container-high` (#2a2a2a) or `highest` (#353535) for cards and modals to create a "lifted" effect.

### The "Glass & Gradient" Rule
To inject "soul" into the dark theme, utilize:
- **Glassmorphism:** For floating navbars or prediction slips, use `surface` at 60% opacity with a `24px` backdrop-blur.
- **Signature Gradients:** Main CTAs should utilize a linear gradient from `primary` (#a4c9ff) to `primary_container` (#2793fb) at a 135-degree angle. This mimics the glow of a cinema screen.

---

## 3. Typography
We use a high-contrast pairing of **Space Grotesk** (Display/Headlines) and **Inter** (Body/Labels) to balance tech-forward modernism with elite readability.

- **Display (Space Grotesk):** Set with tight letter-spacing (-0.04em). These are your "Movie Titles"—bold, authoritative, and cinematic.
- **Body (Inter):** Set with generous line-height (1.6) to ensure the dark theme remains legible and doesn't feel "cramped."
- **Hierarchy as Identity:** Use `display-lg` for market headlines to create an editorial feel. Use `label-sm` in all-caps with `0.1em` tracking for metadata (e.g., "VOLUME," "CLOSES IN") to mimic film credits.

---

## 4. Elevation & Depth
In "The Noir Ledger," depth is perceived through light, not lines.

- **The Layering Principle:** Instead of shadows, place a `surface-container-lowest` card on a `surface-container-low` section. This "recessed" look feels more integrated and premium.
- **Ambient Shadows:** For high-level modals, use a shadow with a `64px` blur, 8% opacity, using the `primary` color as the tint. This creates a "neon glow" rather than a dirty grey smudge.
- **The "Ghost Border" Fallback:** If a divider is required for accessibility, use `outline-variant` at **15% opacity**. It should be felt, not seen.
- **Directional Light:** Apply a subtle 1px "Top Light" (a slightly lighter stroke on the top edge only) to cards to simulate an overhead spotlight.

---

## 5. Components

### Buttons
- **Primary:** High-gloss gradient (`primary` to `primary_container`). `xl` roundedness. White text for maximum "pop."
- **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
- **Tertiary:** Ghost style. No background; text-only using `secondary` (#ffb5a0) to draw attention to "Yes/No" actions.

### Prediction Cards
- **Forbid Dividers:** Use vertical white space (`24px`) to separate the question from the odds.
- **Dynamic Backgrounds:** When a market is "Trending," use a subtle, low-opacity radial gradient of `secondary_container` in the corner of the card.
- **The "Hero" Card:** For featured markets, use an image underlay with a `surface` gradient overlay, making the text appear to float on the cinematography.

### Input Fields
- **State:** `surface-container-highest` background. 
- **Focus:** No change in border color; instead, use a subtle 1px "glow" shadow using the `primary` token.
- **Label:** Floating `label-md` in `on-surface-variant`.

### Selection Chips (Odds Toggles)
- Use `surface-container-high` for unselected.
- Use `primary` for selected, with `on-primary` text.
- Shape: `full` (pill) for a sleek, modern feel.

### Specialized Component: The "Confidence Slider"
A custom slider for bet amounts. The track should be `surface-variant`, while the thumb is a `primary` glowing orb. As the user slides higher, the glow intensity (shadow blur) increases.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `secondary` (#FF4500 equivalents) for "Hot" or "Ending Soon" indicators to create urgency.
- **Do** use `tertiary` (#C7B994 equivalents) for "Expert Opinions" or "Verified" badges to convey a sense of prestige/gold-standard.
- **Do** favor large-scale imagery (film stills, abstract textures) behind cards.

### Don't:
- **Don't** use `#000000` for cards; it kills the depth. Use `surface-container` tiers.
- **Don't** use standard "Success Green." Use the `primary` blue for "Yes" and `secondary` orange/red for "No" to stay on-brand with the cinematic palette.
- **Don't** crowd the screen. If a page feels full, add `32px` of padding. Content needs to "breathe" to feel premium.