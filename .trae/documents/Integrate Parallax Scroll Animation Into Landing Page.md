## Placement & Purpose
- Add a subtle, brand-aligned parallax background to the hero to create depth without distracting from copy and CTAs.
- Use layered shapes (clouds/hills-style) inspired by the provided example, but simplified to match our palette and typography.

## Technical Approach
- Do NOT add GSAP or external libraries. Reuse the existing `ParallaxManager` which already powers `[data-parallax]` elements for high-performance scroll transforms.
- Embed a lightweight SVG (or a set of absolutely-positioned div layers) inside the existing `.parallax-wrapper` in `index.html:36–69` and drive movement via `data-parallax`, `data-parallax-direction`, and `data-parallax-opacity` attributes.
- Keep the effect subtle: speeds between `0.05–0.25`, with vertical movement only and optional fade.

## Implementation Steps
1. Markup (index.html)
- Inside `.hero .parallax-wrapper`, insert 3–5 layers (e.g., background gradient, soft cloud band, two abstract hill shapes).
- Give each layer `class="parallax-layer"` and attributes:
  - `data-parallax="0.08"` (far background), `0.12` (clouds), `0.18/0.22` (near hills)
  - `data-parallax-direction="vertical"`
  - `data-parallax-opacity="true"` for distant layers
- All layers are decorative; no interactive elements.

2. Styling (src/css/style.css)
- Add styles for `.parallax-layer` to fill the hero and sit behind content:
  - `position:absolute; inset:0; pointer-events:none; z-index:-1;`
  - Use CSS variables for colors (e.g., `--color-bg-light`, `--color-primary`) to draw gradients that match the site.
- Remove or bypass the legacy `display:none` on `.parallax-shape` by using a new class (`.parallax-layer`) so existing hide rules remain inert.

3. JS Wiring (no new libs)
- Rely on the existing `ParallaxManager` (src/js/ParallaxManager.js:66–85, 118–145) to pick up the new layers via `[data-parallax]` and animate them on scroll.
- No changes required to `ParallaxManager`. Ensure the hero layers use the expected attributes.

4. Accessibility & Performance
- Respect `prefers-reduced-motion`: `ParallaxManager` already disables itself when motion is reduced.
- Keep transforms GPU-accelerated (it already sets `will-change: transform, opacity`).
- Maintain text contrast and do not obscure hero copy; layers stay behind content with low-opacity gradients.

5. Verification (Preview Only)
- Start the local dev server and open `http://localhost:517x/` to validate:
  - Hero depth effect appears and moves subtly on scroll.
  - No layout shifts; CTAs remain fully readable and clickable.
  - Mobile behavior: ensure speeds remain subtle; verify reduced motion disables effect.
- No commits/pushes.

## Rollback
- Remove the hero layer markup block and associated `.parallax-layer` CSS to instantly disable the effect.

## Notes on Example Folder
- The provided example (`src/parallax-scroll-animation/src`) uses GSAP `ScrollTrigger` to drive a complex SVG sequence.
- We are borrowing its visual concept (layered clouds/hills and gradients) but implementing with the existing `ParallaxManager` to avoid introducing new dependencies and to fit current code conventions.
