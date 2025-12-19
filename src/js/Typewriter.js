export class Typewriter {
  constructor(options = {}) {
    this.speed = options.speed || 35
    this.delayAfter = options.delayAfter || 200
    this.selector = options.selector || '[data-typewriter]'
    this.observer = null
  }
  init() {
    const targets = Array.from(document.querySelectorAll(this.selector))
    targets.forEach(el => {
      if (!el.dataset.typewriterText) el.dataset.typewriterText = el.textContent.trim()
      el.textContent = ''
      el.classList.add('tw-initialized')
    })
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.type(entry.target)
            this.observer.unobserve(entry.target)
          }
        })
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
      targets.forEach(t => this.observer.observe(t))
    } else {
      targets.forEach(t => this.type(t))
    }
  }
  type(el) {
    const full = el.dataset.typewriterText || ''
    let i = 0
    const cursor = document.createElement('span')
    cursor.className = 'tw-cursor'
    el.appendChild(cursor)
    const step = () => {
      if (i < full.length) {
        cursor.insertAdjacentText('beforebegin', full[i])
        i++
        setTimeout(step, this.speed)
      } else {
        setTimeout(() => cursor.remove(), this.delayAfter)
      }
    }
    step()
  }
}
