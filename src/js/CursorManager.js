export class CursorManager {
  constructor(options = {}) {
    this.options = {
      ringDuration: 0.2,
      hoverDuration: 0.2,
      ringScale: 1,
      ringHoverScale: 1.5,
      dotScale: 1,
      dotHoverScale: 0.7,
      ringOpacity: 0.78,
      ringHoverOpacity: 1,
      magneticRadius: 110,
      magneticMax: 10,
      ...options
    };

    this.pointerQuery = window.matchMedia('(pointer: fine)');
    if (!this.pointerQuery.matches) {
      return;
    }

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.gsap = window.gsap;
    if (!this.gsap) {
      return;
    }

    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    this.isVisible = false;
    this.isHovering = false;

    this.init();
  }

  init() {
    this.dot = document.createElement('div');
    this.dot.className = 'cursor-dot';
    this.dot.setAttribute('aria-hidden', 'true');

    this.ring = document.createElement('div');
    this.ring.className = 'cursor-ring';
    this.ring.setAttribute('aria-hidden', 'true');

    document.body.append(this.dot, this.ring);

    this.gsap.set([this.dot, this.ring], {
      x: this.mouse.x,
      y: this.mouse.y,
      xPercent: -50,
      yPercent: -50,
      opacity: 0
    });

    this.dotX = this.gsap.quickSetter(this.dot, 'x', 'px');
    this.dotY = this.gsap.quickSetter(this.dot, 'y', 'px');
    this.ringX = this.gsap.quickTo(this.ring, 'x', {
      duration: this.options.ringDuration,
      ease: 'expo.out',
      overwrite: true
    });
    this.ringY = this.gsap.quickTo(this.ring, 'y', {
      duration: this.options.ringDuration,
      ease: 'expo.out',
      overwrite: true
    });

    this.buildMagnetTargets();
    this.bindHoverTargets();
    this.bindEvents();

    this.ticker = () => {
      this.dotX(this.mouse.x);
      this.dotY(this.mouse.y);
      if (!this.prefersReducedMotion) {
        this.updateMagnetism();
      }
    };

    this.gsap.ticker.add(this.ticker);
  }

  bindEvents() {
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;

      if (!this.isVisible) {
        this.show();
      }

      if (this.prefersReducedMotion) {
        this.gsap.set(this.ring, { x: this.mouse.x, y: this.mouse.y });
      } else {
        this.ringX(this.mouse.x);
        this.ringY(this.mouse.y);
      }
    }, { passive: true });

    window.addEventListener('mouseout', (event) => {
      if (!event.relatedTarget && !event.toElement) {
        this.hide();
      }
    });

    if (!this.prefersReducedMotion) {
      window.addEventListener('mousedown', () => {
        const ringScale = this.isHovering ? this.options.ringHoverScale : this.options.ringScale;
        const dotScale = this.isHovering ? this.options.dotHoverScale : this.options.dotScale;

        this.gsap.to(this.ring, {
          scale: ringScale * 1.08,
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
        this.gsap.to(this.dot, {
          scale: dotScale * 1.1,
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      });
    }
  }

  bindHoverTargets() {
    const targets = document.querySelectorAll('a, button, [role="button"], [data-cursor="hover"]');
    targets.forEach((target) => {
      target.addEventListener('mouseenter', () => this.setHover(true));
      target.addEventListener('mouseleave', () => this.setHover(false));
    });
  }

  setHover(isHovering) {
    if (this.isHovering === isHovering) {
      return;
    }

    this.isHovering = isHovering;
    const ringScale = isHovering ? this.options.ringHoverScale : this.options.ringScale;
    const dotScale = isHovering ? this.options.dotHoverScale : this.options.dotScale;
    const ringOpacity = isHovering ? this.options.ringHoverOpacity : this.options.ringOpacity;

    this.gsap.to(this.ring, {
      scale: ringScale,
      borderWidth: isHovering ? 3 : 2,
      opacity: ringOpacity,
      duration: this.options.hoverDuration,
      ease: 'power2.out',
      overwrite: true
    });
    this.gsap.to(this.dot, {
      scale: dotScale,
      duration: this.options.hoverDuration,
      ease: 'power2.out',
      overwrite: true
    });
  }

  show() {
    this.isVisible = true;
    this.gsap.to(this.dot, {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out'
    });
    this.gsap.to(this.ring, {
      opacity: this.options.ringOpacity,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  hide() {
    this.isVisible = false;
    this.gsap.to([this.dot, this.ring], {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  buildMagnetTargets() {
    if (this.prefersReducedMotion) {
      return;
    }

    const magnetElements = Array.from(document.querySelectorAll('[data-magnetic]'));
    this.magnets = magnetElements.map((el) => ({
      el,
      xTo: this.gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' }),
      yTo: this.gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' })
    }));
  }

  updateMagnetism() {
    if (!this.magnets || this.magnets.length === 0) {
      return;
    }

    this.magnets.forEach(({ el, xTo, yTo }) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = this.mouse.x - centerX;
      const deltaY = this.mouse.y - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < this.options.magneticRadius) {
        const pull = (1 - distance / this.options.magneticRadius) * this.options.magneticMax;
        const x = distance ? (deltaX / distance) * pull : 0;
        const y = distance ? (deltaY / distance) * pull : 0;
        xTo(x);
        yTo(y);
      } else {
        xTo(0);
        yTo(0);
      }
    });
  }
}
