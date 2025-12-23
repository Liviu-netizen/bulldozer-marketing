import { ParallaxManager } from './ParallaxManager.js';

export class ScrollManager {
  constructor(options = {}) {
    this.options = {
      enableParallax: true,
      revealThreshold: 0.15,
      smoothScrollDuration: 1000,
      ...options
    };
    
    this.parallax = this.options.enableParallax ? new ParallaxManager() : null;
    this.init();
  }

  init() {
    this.initReveal();
    this.initHeroMorph();
    this.initSmoothScroll();
    this.checkInitialHash();
    
    // Performance monitoring could go here
    console.log('ScrollManager initialized');
  }

  initReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');

    if (revealElements.length === 0) {
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        revealElements.forEach(el => el.classList.add('is-visible'));
        return;
      }

      gsap.set(revealElements, { autoAlpha: 0, y: 30 });

      revealElements.forEach(el => {
        const delayClass = Array.from(el.classList).find(cls => cls.startsWith('scroll-reveal-delay-'));
        const delay = delayClass ? Number(delayClass.replace('scroll-reveal-delay-', '')) * 0.1 : 0;

        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      });

      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
      }, { once: true });

      return;
    }

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

  initHeroMorph() {
    const hero = document.querySelector('.hero');
    const morph = document.querySelector('.hero__morph');
    const heroContent = document.querySelector('.hero__container');

    if (!hero || !morph || !heroContent) {
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!gsap || !ScrollTrigger) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    gsap.set(morph, { xPercent: 0, yPercent: 0, scale: 1, rotate: 0 });
    gsap.set(heroContent, { autoAlpha: 1, y: 0 });

    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
      .to(morph, {
        scale: 1.2,
        rotate: 10,
        xPercent: -8,
        yPercent: 6,
        borderRadius: '30% 70% 55% 45% / 40% 35% 65% 60%',
        opacity: 0.35,
        ease: 'none'
      }, 0)
      .to(heroContent, {
        autoAlpha: 0.2,
        y: -40,
        ease: 'none'
      }, 0);
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
