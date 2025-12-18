import { ScrollManager } from './js/ScrollManager.js';
import { FormManager } from './js/FormManager.js';

// Toggle functionality for Outcomes section
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Scroll Manager (handles Parallax, Reveal, Smooth Scroll)
  const scrollManager = new ScrollManager();

  // Initialize Form Manager (handles Booking & Scorecard)
  const formManager = new FormManager();

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
});
