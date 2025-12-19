export class Typewriter {
  constructor(options = {}) {
    this.speed = options.speed || 35
    this.delayAfter = options.delayAfter || 200
    this.selector = options.selector || '[data-typewriter]'
    this.groupSelector = options.groupSelector || '[data-typewriter-group]'
    this.observer = null
  }
  init() {
    const singles = Array.from(document.querySelectorAll(this.selector))
    const groups = Array.from(document.querySelectorAll(this.groupSelector))
    singles.forEach(el => {
      if (!el.dataset.typewriterText) el.dataset.typewriterText = el.textContent.trim()
      el.textContent = ''
      el.classList.add('tw-initialized')
    })
    groups.forEach(group => {
      const lines = Array.from(group.querySelectorAll('[data-typewriter-line]'))
      lines.forEach(line => {
        if (!line.dataset.typewriterText) line.dataset.typewriterText = line.textContent.trim()
        line.textContent = ''
        line.classList.add('tw-initialized')
      })
    })
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target.hasAttribute('data-typewriter-group')) {
              this.typeGroup(entry.target)
            } else {
              this.type(entry.target)
            }
            this.observer.unobserve(entry.target)
          }
        })
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
      singles.forEach(t => this.observer.observe(t))
      groups.forEach(g => this.observer.observe(g))
    } else {
      singles.forEach(t => this.type(t))
      groups.forEach(g => this.typeGroup(g))
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
  typeGroup(group) {
    const lines = Array.from(group.querySelectorAll('[data-typewriter-line]'))
    const typeLine = (idx) => {
      if (idx >= lines.length) return
      const el = lines[idx]
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
          setTimeout(() => {
            cursor.remove()
            setTimeout(() => typeLine(idx + 1), this.delayAfter)
          }, this.delayAfter)
        }
      }
      step()
    }
    typeLine(0)
  }
}
