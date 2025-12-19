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
    this.checkInitialHash();
    
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
        if (!targetId || targetId === '#') return;
        
        // Prevent default behavior to handle it manually
        e.preventDefault();
        
        this.scrollToTarget(targetId);
      });
    });
  }

  checkInitialHash() {
    // Check if page loaded with a hash
    if (window.location.hash) {
      const targetId = window.location.hash;
      // Wait longer for layout to settle (typewriter initialization, etc)
      setTimeout(() => {
        this.scrollToTarget(targetId);
      }, 500);
    }
  }

  scrollToTarget(targetId) {
    try {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Close mobile menu if open
        const nav = document.querySelector('.header__nav');
        const mobileToggle = document.querySelector('.header__mobile-toggle');
        if (nav && nav.classList.contains('header__nav--open')) {
          nav.classList.remove('header__nav--open');
          mobileToggle.classList.remove('open');
        }

        // Calculate position with header offset
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        // Smooth scroll to calculated position
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL hash without jumping
        history.pushState(null, null, targetId);
      } else {
        console.warn(`ScrollManager: Target element ${targetId} not found`);
      }
    } catch (error) {
      console.error(`ScrollManager: Error scrolling to ${targetId}`, error);
    }
  }
}
