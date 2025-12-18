/**
 * ParallaxManager
 * Handles high-performance parallax scrolling effects using requestAnimationFrame
 * and CSS transforms for hardware acceleration.
 */
export class ParallaxManager {
  constructor(options = {}) {
    this.options = {
      speedMultiplier: 1,
      disableOnMobile: false,
      enableBlur: false,
      lerpFactor: 0.1, // Smooth easing factor (lower is smoother/slower)
      ...options
    };

    this.elements = [];
    this.ticking = false;
    this.scrollY = 0;
    this.windowHeight = 0;
    this.isEnabled = true;
    this.perfMonitor = {
      lastFrameTime: 0,
      frameCount: 0,
      fps: 60,
      lowPerfFrames: 0
    };

    this.init();
  }

  init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      this.isEnabled = false;
      return;
    }

    // Check mobile if disabled
    if (this.options.disableOnMobile && window.matchMedia('(max-width: 768px)').matches) {
      this.isEnabled = false;
      return;
    }

    // Initial setup
    this.updateDimensions();
    // Wait for DOM to be fully ready for accurate positions
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.scanElements());
    } else {
      this.scanElements();
    }
    
    // Event listeners
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
    
    // Start loop
    this.animate();
    
    console.log('ParallaxManager initialized');
  }

  scanElements() {
    // Find all elements with data-parallax attribute
    const nodes = document.querySelectorAll('[data-parallax]');
    this.elements = Array.from(nodes).map(node => {
      const speed = parseFloat(node.dataset.parallax) || 0.1;
      const direction = node.dataset.parallaxDirection || 'vertical';
      const useOpacity = node.dataset.parallaxOpacity === 'true';
      
      // Setup initial styles for performance
      node.style.willChange = 'transform, opacity';
      node.style.transform = 'translate3d(0, 0, 0)';

      return {
        node,
        speed,
        direction,
        useOpacity,
        baseY: node.getBoundingClientRect().top + window.scrollY,
        currentPos: 0, // For lerp
        targetPos: 0   // For lerp
      };
    });
  }

  updateDimensions() {
    this.windowHeight = window.innerHeight;
    this.scrollY = window.scrollY;
  }

  onScroll() {
    this.scrollY = window.scrollY;
  }

  onResize() {
    this.updateDimensions();
    // Re-calculate base positions on resize
    this.elements.forEach(el => {
      el.node.style.transform = '';
      el.baseY = el.node.getBoundingClientRect().top + window.scrollY;
      el.currentPos = 0;
      el.targetPos = 0;
    });
  }

  animate(timestamp) {
    if (!this.isEnabled) return;

    requestAnimationFrame(this.animate.bind(this));

    // Performance monitoring
    if (timestamp) {
      this.monitorPerformance(timestamp);
    }

    this.elements.forEach(el => {
      // Calculate target position based on scroll
      // Distance from initial position
      const scrollDist = this.scrollY;
      const relativeDist = scrollDist * el.speed * this.options.speedMultiplier;
      
      el.targetPos = relativeDist;

      // Apply Lerp (Linear Interpolation) for easing
      // current = current + (target - current) * factor
      el.currentPos += (el.targetPos - el.currentPos) * this.options.lerpFactor;

      // Apply transform
      if (el.direction === 'vertical') {
        el.node.style.transform = `translate3d(0, ${el.currentPos}px, 0)`;
      } else if (el.direction === 'horizontal') {
        el.node.style.transform = `translate3d(${el.currentPos}px, 0, 0)`;
      }

      // Apply Opacity if enabled
      if (el.useOpacity) {
        // Fade out as it moves down/up
        // Simple logic: opacity relates to how far it moved
        const opacity = Math.max(0, 1 - Math.abs(el.currentPos) / 500);
        el.node.style.opacity = opacity;
      }
    });
  }

  monitorPerformance(timestamp) {
    if (!this.perfMonitor.lastFrameTime) {
      this.perfMonitor.lastFrameTime = timestamp;
      return;
    }

    const delta = timestamp - this.perfMonitor.lastFrameTime;
    this.perfMonitor.lastFrameTime = timestamp;
    
    // Simple FPS approximation
    const fps = 1000 / delta;
    
    if (fps < 30) {
      this.perfMonitor.lowPerfFrames++;
    } else {
      this.perfMonitor.lowPerfFrames = Math.max(0, this.perfMonitor.lowPerfFrames - 1);
    }

    // Auto-disable if performance is consistently bad (e.g., 60 frames < 30fps)
    if (this.perfMonitor.lowPerfFrames > 60) {
      console.warn('Parallax disabled due to low performance');
      this.disable();
    }
  }

  disable() {
    this.isEnabled = false;
    window.removeEventListener('scroll', this.onScroll);
    this.elements.forEach(el => {
      el.node.style.transform = '';
      el.node.style.willChange = 'auto';
      el.node.style.opacity = '';
    });
  }
}
