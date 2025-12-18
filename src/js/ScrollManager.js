/**
 * ScrollManager.js
 * Comprehensive scroll behavior enhancement package
 * - Smooth Anchor Scrolling
 * - High-Performance Parallax
 * - Scroll-Triggered Reveal Effects
 */

export class ScrollManager {
  constructor(options = {}) {
    this.options = {
      smoothScrollDuration: 800,
      parallaxMultiplier: 1.0,
      disableParallaxOnMobile: false,
      revealThreshold: 0.15, // 15% of element visible
      ...options
    };

    // State
    this.scrollY = 0;
    this.windowHeight = 0;
    this.parallaxElements = [];
    this.revealElements = [];
    this.ticking = false;
    this.isScrolling = false;
    
    // Performance monitoring
    this.perf = {
      lastFrame: 0,
      lowFpsCount: 0,
      disabled: false
    };

    this.init();
  }

  init() {
    if (this.shouldReduceMotion()) {
      console.log('Reduced motion preferred. Disabling effects.');
      return;
    }

    this.updateDimensions();
    
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    this.scanElements();
    this.setupEventListeners();
    this.animate();
    
    // Trigger initial reveal check
    this.checkReveals();
  }

  shouldReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  updateDimensions() {
    this.windowHeight = window.innerHeight;
    this.scrollY = window.scrollY;
  }

  scanElements() {
    // Parallax Elements
    const pNodes = document.querySelectorAll('[data-parallax]');
    this.parallaxElements = Array.from(pNodes).map(node => ({
      node,
      speed: parseFloat(node.dataset.parallax) || 0.1,
      direction: node.dataset.parallaxDirection || 'vertical',
      useOpacity: node.dataset.parallaxOpacity === 'true',
      baseY: node.getBoundingClientRect().top + window.scrollY,
      currentPos: 0,
      targetPos: 0
    }));

    // Reveal Elements
    // Either explicit class or data attribute
    const rNodes = document.querySelectorAll('.scroll-reveal, [data-scroll-reveal]');
    
    // Use IntersectionObserver for performant reveals
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: this.options.revealThreshold
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optional: Stop observing once revealed
          // observer.unobserve(entry.target); 
        } else {
          // Optional: Hide again when out of view (for repeated effects)
          // entry.target.classList.remove('is-visible'); 
        }
      });
    }, observerOptions);

    rNodes.forEach(node => {
      node.classList.add('scroll-reveal-init'); // Ensure initial hidden state
      this.revealElements.push(node);
      revealObserver.observe(node);
    });
  }

  setupEventListeners() {
    // Passive scroll listener for state update
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
      this.isScrolling = true;
      
      // Debounce scroll end
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 150);
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.updateDimensions();
      // Recalculate bases
      this.parallaxElements.forEach(el => {
        // Reset transform to get true position
        el.node.style.transform = '';
        el.baseY = el.node.getBoundingClientRect().top + window.scrollY;
      });
    }, { passive: true });

    // Smooth Anchor Scrolling Interception
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          this.smoothScrollTo(targetElement);
        }
      });
    });
  }

  /**
   * Custom Smooth Scroll using requestAnimationFrame
   * Easing: easeInOutCubic approximation
   */
  smoothScrollTo(target) {
    const startPosition = window.scrollY;
    const targetPosition = target.getBoundingClientRect().top + startPosition - 80; // Offset for header
    const distance = targetPosition - startPosition;
    const duration = this.options.smoothScrollDuration;
    let start = null;

    const ease = (t) => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      
      window.scrollTo(0, startPosition + distance * ease(percentage));

      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  checkReveals() {
    // Fallback for browsers without IntersectionObserver or for complex logic
    // Currently handled by IntersectionObserver in scanElements
  }

  animate(timestamp) {
    if (this.perf.disabled) return;

    requestAnimationFrame(this.animate.bind(this));

    // Performance check
    if (timestamp) {
      if (!this.perf.lastFrame) this.perf.lastFrame = timestamp;
      const delta = timestamp - this.perf.lastFrame;
      this.perf.lastFrame = timestamp;
      
      if (1000/delta < 30) {
        this.perf.lowFpsCount++;
        if (this.perf.lowFpsCount > 60) {
          console.warn('Disabling scroll effects due to low performance');
          this.perf.disabled = true;
          this.cleanup();
          return;
        }
      } else {
        this.perf.lowFpsCount = Math.max(0, this.perf.lowFpsCount - 1);
      }
    }

    // Parallax Logic
    this.parallaxElements.forEach(el => {
      // Check mobile
      if (this.options.disableParallaxOnMobile && window.innerWidth < 768) return;

      const relativeDist = (this.scrollY - el.baseY) * el.speed * this.options.parallaxMultiplier;
      el.targetPos = relativeDist;

      // Lerp for smoothness (0.1 factor)
      el.currentPos += (el.targetPos - el.currentPos) * 0.1;

      // Optimize: Only apply if changing
      if (Math.abs(el.targetPos - el.currentPos) > 0.05) {
        const transform = el.direction === 'horizontal' 
          ? `translate3d(${el.currentPos}px, 0, 0)`
          : `translate3d(0, ${el.currentPos}px, 0)`;
        
        el.node.style.transform = transform;

        if (el.useOpacity) {
          // Fade out based on distance moved (parallax-y)
          // Adjust divisor to control fade speed
          const opacity = Math.max(0, 1 - Math.abs(el.currentPos) / 300);
          el.node.style.opacity = opacity;
        }
      }
    });
  }

  cleanup() {
    this.parallaxElements.forEach(el => {
      el.node.style.transform = '';
      el.node.style.opacity = '';
    });
  }
}
