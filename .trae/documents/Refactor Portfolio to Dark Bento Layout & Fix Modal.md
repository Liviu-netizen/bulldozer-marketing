## Design Refinements
- **Portfolio Grid:** Switch to a dark-theme bento layout mirroring the visual reference.
  - **Left Column:** A large, dark "CTA Tile" (`.bento-left`) serving as the visual anchor. It will feature a strong headline ("Selected Work"), subhead, and a "Join now" button (linking to booking).
  - **Right Column:** A 2-column grid (`.bento-right`) containing the project tiles.
    - **Tile Styling:** Dark cards with rounded corners, subtle borders, and hover lift.
    - **Typography:** Bold white titles inside the cards, positioned below the images or overlaid at the bottom.
- **Modal Fix:** Ensure the modal populates correctly by reading `data-` attributes from the clicked card.
  - The JS logic will be updated to target the correct selectors (`.portfolio-card` vs `.bento-item`) and populate the modal's image, title, and description.
- **Landing Page Hook:** Add a "Selected Work" section near the top of the landing page (below Hero, above Outcomes) that teases the portfolio.
  - It will feature a 3-item preview row and a "View Full Portfolio" button.

## Technical Implementation
1. **Portfolio Page (`portfolio.html`):**
   - Remove the `viewport-toggle` buttons entirely.
   - Restructure the `.bento-grid` to have a dedicated `.bento-left` (CTA) and `.bento-right` (Projects).
   - Apply dark theme classes (`portfolio-card--dark`) to matches the reference.

2. **Styling (`src/css/style.css`):**
   - Update `.bento-grid` CSS to support the 1/3 (Left) + 2/3 (Right) split on desktop.
   - Style `.bento-left` as a prominent dark card with large type.
   - Style project cards with dark backgrounds, white text, and hover effects consistent with the "Educast" reference style.
   - Remove `.simulate-mobile` styles and toggle button CSS.

3. **Landing Page (`index.html`):**
   - Insert a new `<section class="portfolio-teaser">` after the Hero.
   - Include a section header and a simplified 3-card grid (reusing portfolio card styles).
   - Add a CTA button linking to `/portfolio.html`.

4. **JavaScript (`src/main.js`):**
   - Update the modal click handler to robustly find `data-image`, `data-title`, and `data-desc` on the clicked element (handling clicks on children like images/text).
   - Remove the viewport toggle logic.

## Validation
- **Preview:** Verify the portfolio page matches the "dark bento" aesthetic locally.
- **Interaction:** Confirm clicking a project opens the modal with the correct content.
- **Responsiveness:** Ensure the bento grid stacks vertically on mobile.
- **Navigation:** Check the new "Selected Work" section on the landing page links correctly.
