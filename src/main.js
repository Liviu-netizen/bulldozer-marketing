import { ScrollManager } from './js/ScrollManager.js';
import { SupabaseManager } from './js/SupabaseManager.js';
import { Typewriter } from './js/Typewriter.js';
import { gsap, ScrollTrigger, MotionPathPlugin, Flip } from 'gsap/all';

const splitIntoChars = (el) => {
  if (!el || el.dataset.gsapSplit === 'true') return [];
  const text = el.textContent || '';
  el.textContent = '';
  el.dataset.gsapSplit = 'true';

  const chars = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'gsap-char';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(span);
    chars.push(span);
  }
  return chars;
};

const initExtremeLandingParallax = () => {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, Flip);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionFactor = prefersReduced ? 0.35 : 1;

  ScrollTrigger.getAll().forEach(t => {
    if (t.vars && t.vars.id && String(t.vars.id).startsWith('landing-')) t.kill();
  });

  const hero = document.querySelector('.hero');
  const heroLayers = gsap.utils.toArray('.parallax-wrapper [data-speed]');
  if (hero && heroLayers.length) {
    heroLayers.forEach((layer, i) => {
      const speedRaw = Number.parseFloat(layer.dataset.speed || '');
      const speed = Number.isFinite(speedRaw) ? speedRaw : 0.2;
      const dir = i % 2 === 0 ? 1 : -1;

      gsap.to(layer, {
        x: () => Math.round(dir * hero.offsetWidth * 0.15 * speed * 10 * motionFactor),
        y: () => Math.round(hero.offsetHeight * speed * 5 * motionFactor),
        rotation: dir * 35 * speed * 6 * motionFactor,
        scale: 1 + speed * 1.8,
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          id: `landing-hero-layer-${i}`,
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      gsap.to(layer, {
        borderRadius: '38% 62% 55% 45% / 40% 50% 50% 60%',
        duration: 1.2 + i * 0.25,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });

    const comet = hero.querySelector('.parallax-comet');
    if (comet) {
      gsap.to(comet, {
        motionPath: {
          path: [
            { x: -200, y: -100 },
            { x: window.innerWidth * 0.55, y: 200 },
            { x: window.innerWidth * 0.15, y: 520 },
            { x: window.innerWidth * 0.9, y: 820 }
          ],
          curviness: 1.8,
          autoRotate: true
        },
        ease: 'none',
        scrollTrigger: {
          id: 'landing-comet',
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true
        }
      });
    }
  }

  const parallaxTargets = gsap.utils.toArray([
    '.work-hook-card',
    '.pillar-card',
    '.metric-card',
    '.timeline-card',
    '.deliverable-item',
    '.pricing-card',
    '.outcome-card',
    '.scorecard__content',
    '.booking-form-wrapper',
    '.logo-placeholder'
  ].join(','));

  parallaxTargets.forEach((el, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    gsap.fromTo(
      el,
      {
        y: 220 * dir * motionFactor,
        rotation: 6 * dir * motionFactor,
        scale: 1 - 0.04 * motionFactor
      },
      {
        y: -220 * dir * motionFactor,
        rotation: -6 * dir * motionFactor,
        scale: 1 + 0.08 * motionFactor,
        ease: 'none',
        scrollTrigger: {
          id: `landing-el-${i}`,
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true
        }
      }
    );
  });

  const splitTargets = gsap.utils.toArray([
    '.work-hook-card__title',
    '.metric-card__value',
    '.pricing-card__title',
    '.deliverable-item h3',
    '.outcome-card__title',
    '.scorecard__title',
    '.cta-final__title'
  ].join(','));

  splitTargets.forEach((el, i) => {
    const chars = splitIntoChars(el);
    if (chars.length === 0) return;
    gsap.from(chars, {
      y: 80 * motionFactor,
      rotationX: 90,
      opacity: 0,
      stagger: 0.015,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: {
        id: `landing-split-${i}`,
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};

const initFlipToggleSwitch = () => {
  const toggleSwitch = document.querySelector('.toggle-switch');
  if (!toggleSwitch) return;

  const buttons = Array.from(toggleSwitch.querySelectorAll('.toggle-switch__btn'));
  if (buttons.length === 0) return;

  const indicator = document.createElement('span');
  indicator.className = 'toggle-switch__indicator';
  const initialTarget = toggleSwitch.querySelector('.toggle-switch__btn--active') || buttons[0];
  initialTarget.insertBefore(indicator, initialTarget.firstChild);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const state = Flip.getState(indicator);
      btn.insertBefore(indicator, btn.firstChild);
      Flip.from(state, {
        duration: 0.6,
        ease: 'power3.out',
        absolute: true
      });
    });
  });
};

const initHeroParallax = () => {
  const hero = document.querySelector('.hero');
  const layers = Array.from(document.querySelectorAll('.parallax-layer'));
  if (!hero || layers.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.getAll().forEach(t => {
    if (t.vars && t.vars.id === 'hero-parallax') t.kill();
  });
  gsap.killTweensOf(layers);

  const motionFactor = prefersReduced ? 0.15 : 1;

  layers.forEach(layer => {
    const speedRaw = Number.parseFloat(layer.dataset.speed || '');
    const speed = Number.isFinite(speedRaw) ? speedRaw : 0.2;

    gsap.to(layer, {
      y: () => Math.round(hero.offsetHeight * speed * 3 * motionFactor),
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: 'hero-parallax',
        trigger: hero,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
};

// Toggle functionality for Outcomes section
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Scroll Manager (handles Parallax, Reveal, Smooth Scroll)
  const scrollManager = new ScrollManager({ enableParallax: false });

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

  initExtremeLandingParallax();
  initFlipToggleSwitch();
  
  // Lightbox Modal Logic
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = lightbox ? lightbox.querySelector('.lightbox__content') : null;
  
  // We will dynamically rebuild the image/carousel part on open
  const openLightbox = (card) => {
    if (card.classList.contains('gallery-card--cta')) return;

    const title = card.dataset.title || '';
    const desc = card.dataset.desc || '';
    const tools = card.dataset.tools || '';
    let images = [];
    
    try {
      images = JSON.parse(card.dataset.images || '[]');
      // Normalize to relative public path for GitHub Pages / subpath deployments
      images = images
        .map(src => src.replace(/^src\/portofolio-media\//, './portofolio-media/'))
        .map(src => src.replace(/^\/portofolio-media\//, './portofolio-media/'))
        .map(src => src.startsWith('portofolio-media/') ? `./${src}` : src);
    } catch (e) {
      console.error('Error parsing images', e);
    }
    
    // Fallback if no data attributes (shouldn't happen with new HTML)
    if (images.length === 0) {
      const imgEl = card.querySelector('img');
      if (imgEl) images.push(imgEl.src);
    }

    if (!lightbox || !lightboxContent) return;

    // Clear existing content (except close button)
    const closeBtn = lightboxContent.querySelector('.lightbox__close');
    lightboxContent.innerHTML = '';
    lightboxContent.appendChild(closeBtn);

    // Create Media Container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'lightbox__media';
    
    if (images.length > 1) {
      // Carousel Logic
      mediaContainer.classList.add('lightbox__media--carousel');
      
      const scrollContainer = document.createElement('div');
      scrollContainer.className = 'lightbox__scroll-container';
      
      images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'lightbox__image';
        scrollContainer.appendChild(img);
      });
      
      mediaContainer.appendChild(scrollContainer);
      
      // Add controls
      const prevBtn = document.createElement('button');
      prevBtn.className = 'lightbox__control lightbox__control--prev';
      prevBtn.innerHTML = '&#10094;'; // Left arrow
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'lightbox__control lightbox__control--next';
      nextBtn.innerHTML = '&#10095;'; // Right arrow
      
      prevBtn.onclick = () => {
        scrollContainer.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
      };
      
      nextBtn.onclick = () => {
        scrollContainer.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
      };
      
      mediaContainer.appendChild(prevBtn);
      mediaContainer.appendChild(nextBtn);
      
    } else if (images.length === 1) {
      // Single Image
      const img = document.createElement('img');
      img.src = images[0];
      img.className = 'lightbox__image';
      mediaContainer.appendChild(img);
    }

    lightboxContent.appendChild(mediaContainer);

    // Caption Container
    const caption = document.createElement('div');
    caption.className = 'lightbox__caption';
    
    const h3 = document.createElement('h3');
    h3.className = 'lightbox__title';
    h3.textContent = title;
    caption.appendChild(h3);
    
    if (tools) {
      const toolsP = document.createElement('p');
      toolsP.className = 'lightbox__tools';
      toolsP.innerHTML = `<span class="tw-cursor" style="display:none"></span><strong>Tools:</strong> ${tools}`;
      caption.appendChild(toolsP);
    }
    
    if (desc) {
      const descP = document.createElement('p');
      descP.className = 'lightbox__desc';
      descP.textContent = desc;
      caption.appendChild(descP);
    }

    lightboxContent.appendChild(caption);

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Optional: clear content after delay to reset
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
