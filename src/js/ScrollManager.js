import { ParallaxManager } from './ParallaxManager.js';

export class ScrollManager {
  constructor(options = {}) {
    this.options = {
      revealThreshold: 0.15,
      smoothScrollDuration: 1000,
      ...options
    };
    
    this.parallax = new ParallaxManager();
    this.init();
  }

  init() {
    this.initReveal();
    this.initSmoothScroll();
    
    // Performance monitoring could go here
    console.log('ScrollManager initialized');
  }

  initReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Only animate once
          }
        });
      }, {
        threshold: this.options.revealThreshold,
        rootMargin: '0px 0px -50px 0px'
      });

      revealElements.forEach(el => observer.observe(el));
    } else {
      // Fallback for older browsers
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  }

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          
          // Close mobile menu if open
          const nav = document.querySelector('.header__nav');
          const mobileToggle = document.querySelector('.header__mobile-toggle');
          if (nav && nav.classList.contains('header__nav--open')) {
            nav.classList.remove('header__nav--open');
            mobileToggle.classList.remove('open');
          }

          // Smooth scroll
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}
