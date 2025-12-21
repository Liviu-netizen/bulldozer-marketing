import { ScrollManager } from './js/ScrollManager.js';
import { SupabaseManager } from './js/SupabaseManager.js';
import { Typewriter } from './js/Typewriter.js';

// Toggle functionality for Outcomes section
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Scroll Manager (handles Parallax, Reveal, Smooth Scroll)
  const scrollManager = new ScrollManager();

  // Initialize Supabase Manager (handles Booking & Scorecard)
  const supabaseManager = new SupabaseManager();

  const toggleBtns = document.querySelectorAll('.toggle-switch__btn');
  const outcomeCards = document.querySelectorAll('.outcome-card');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      toggleBtns.forEach(b => b.classList.remove('toggle-switch__btn--active'));
      // Add active class to clicked button
      btn.classList.add('toggle-switch__btn--active');

      // Note: In the design provided, it seems like a content switch. 
      // For this demo, I'll simulate it or just keep the visual state if there's only one card shown in the design.
      // If there were multiple cards, I'd switch them here based on data-target.
      // For now, let's just animate the card slightly to show interaction.
      const target = btn.dataset.target;
      console.log(`Switched to ${target}`);
      
      const card = document.querySelector('.outcome-card');
      card.style.opacity = '0.5';
      setTimeout(() => {
        card.style.opacity = '1';
      }, 200);
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.header__mobile-toggle');
  const nav = document.querySelector('.header__nav');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      nav.classList.toggle('header__nav--open');
      mobileToggle.classList.toggle('open');
    });
  }
  
  const typer = new Typewriter({ speed: 35, delayAfter: 200 });
  typer.init();
  
  // Lightbox Modal Logic
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox__image') : null;
  const lightboxTitle = lightbox ? lightbox.querySelector('.lightbox__title') : null;
  const lightboxDesc = lightbox ? lightbox.querySelector('.lightbox__desc') : null;

  const openLightbox = (card) => {
    // Only open if it's not the CTA card
    if (card.classList.contains('gallery-card--cta')) return;

    const imgEl = card.querySelector('img');
    const titleEl = card.querySelector('.gallery-card__title');
    const catEl = card.querySelector('.gallery-card__category');

    if (!imgEl) return;

    const imgSrc = imgEl.src;
    const imgAlt = imgEl.alt || '';
    const title = titleEl ? titleEl.textContent : '';
    const category = catEl ? catEl.textContent : '';

    if (lightbox && lightboxImg && lightboxTitle && lightboxDesc) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = imgAlt;
      lightboxTitle.textContent = title;
      lightboxDesc.textContent = category;
      
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (lightboxImg) setTimeout(() => { lightboxImg.src = ''; }, 300); // Clear after fade out
      document.body.style.overflow = '';
    }
  };

  const galleryCards = document.querySelectorAll('.gallery-card');
  galleryCards.forEach(c => {
    c.addEventListener('click', (e) => {
      // Allow links inside cards to work (like the CTA button)
      if (e.target.tagName === 'A' || e.target.closest('a')) return;
      openLightbox(c);
    });
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof Element && t.hasAttribute('data-close')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});
