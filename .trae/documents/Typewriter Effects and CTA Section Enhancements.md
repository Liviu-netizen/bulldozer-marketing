## Scope
- Enlarge the final CTA section (title, description, spacing, form box).
- Add a performant typewriter effect that triggers when headings/subheads come into view.
- Apply effect to the specified pairs across sections: Outcomes, Pillars, Results, System, Deliverables, Pricing, Scorecard, FAQ, and Final CTA.

## Implementation
- Add a small Typewriter module (`src/js/Typewriter.js`) using IntersectionObserver and a lightweight state loop.
- Tag target elements with `data-typewriter` in `index.html` (titles and descriptions only; lists remain static).
- Initialize in `src/main.js`.
- Add minimal CSS for cursor and spacing.
- Increase `.cta-final` sizing (padding, title size, description size, booking form width/padding).

## Verification
- Test scroll-triggered typing on each section.
- Confirm no layout shift; cursor blinks during typing and disappears after.
- Ensure accessibility: content present in DOM, typed progressively.

## Deliverables
- Updated HTML tags with `data-typewriter`.
- New `Typewriter.js` and init hook.
- CSS cursor and CTA sizing tweaks.
- Git commits and push.