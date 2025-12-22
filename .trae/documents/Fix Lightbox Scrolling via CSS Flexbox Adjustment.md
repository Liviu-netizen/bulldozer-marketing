I will fix the scrolling issue by adjusting the CSS for the `.lightbox` container.

**The Problem:**
The `align-items: center` property on the flex container is forcing the content to center even when it overflows, which causes the top of the content to be clipped and makes scrolling ineffective in many browsers.

**The Fix:**

1. **Modify** **`src/css/style.css`:**

   * Remove `align-items: center` and `justify-content: center` from the `.lightbox` class.

   * Ensure `.lightbox__content` uses `margin: auto` to achieve "safe centering" (centers when small, top-aligns when tall).

   * This combination ensures that when the content is taller than the screen, it starts at the top and the browser's native scroll behavior works perfectly on the `.lightbox` container.

**Steps:**

1. Edit `src/css/style.css` to update the `.lightbox` and `.lightbox__content` rules.
2. Verify that long content (like "Movesense") is fully scrollable and accessible.

