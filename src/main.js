import { ScrollManager } from './js/ScrollManager.js';
import { SupabaseManager } from './js/SupabaseManager.js';

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
