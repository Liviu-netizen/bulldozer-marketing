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
    this.scanElements();
    
    if (this.elements.length === 0) return;

    // Event listeners
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
    
    // Start loop
    this.animate();
  }

  scanElements() {
    // Find all elements with data-parallax attribute
    const nodes = document.querySelectorAll('[data-parallax]');
    this.elements = Array.from(nodes).map(node => {
      const speed = parseFloat(node.dataset.parallax) || 0.1;
      const direction = node.dataset.parallaxDirection || 'vertical';
      
      // Setup initial styles for performance
      node.style.willChange = 'transform';
      node.style.transform = 'translate3d(0, 0, 0)';

      return {
        node,
        speed,
        direction,
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

    let isMoving = false;

    this.elements.forEach(el => {
      // Calculate target position based on scroll
      const distance = (this.scrollY - el.baseY) * el.speed * this.options.speedMultiplier;
      el.targetPos = distance;

      // Apply Lerp (Linear Interpolation) for easing
      // current = current + (target - current) * factor
      el.currentPos += (el.targetPos - el.currentPos) * this.options.lerpFactor;

      // Check if we're close enough to stop updating (optimization)
      // But since we have a continuous loop now for lerp, we just check if visual update is needed
      if (Math.abs(el.targetPos - el.currentPos) > 0.01) {
        isMoving = true;
      }

      // Apply transform
      if (el.direction === 'vertical') {
        el.node.style.transform = `translate3d(0, ${el.currentPos}px, 0)`;
      } else if (el.direction === 'horizontal') {
        el.node.style.transform = `translate3d(${el.currentPos}px, 0, 0)`;
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
    });
  }
}
