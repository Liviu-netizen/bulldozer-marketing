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
  
  const modal = document.getElementById('portfolio-modal');
  const modalImg = modal ? modal.querySelector('.portfolio-modal__image') : null;
  const modalTitle = modal ? modal.querySelector('.portfolio-modal__title') : null;
  const modalDesc = modal ? modal.querySelector('.portfolio-modal__desc') : null;
  const openPortfolioModal = (card) => {
    const img = card.dataset.image;
    const title = card.dataset.title;
    const desc = card.dataset.desc;
    if (!img) return;
    if (modal && modalImg && modalTitle && modalDesc) {
      modalImg.src = img;
      modalImg.alt = title || '';
      modalTitle.textContent = title || '';
      modalDesc.textContent = desc || '';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };
  const closePortfolioModal = () => {
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (modalImg) modalImg.src = '';
      document.body.style.overflow = '';
    }
  };
  const cards = document.querySelectorAll('.portfolio-card[data-image]');
  cards.forEach(c => {
    c.addEventListener('click', () => openPortfolioModal(c));
  });
  if (modal) {
    modal.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof Element && t.hasAttribute('data-close')) closePortfolioModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePortfolioModal();
    });
  }
});
