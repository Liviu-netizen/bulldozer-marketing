import { Storage } from './storage.js';

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => e.appendChild(c));
  return e;
}

function ensureSeed() {
  if (Storage.getPortfolio().length) return;
  Storage.addPortfolioItem({
    title: 'Pipeline growth',
    subtitle: 'B2B SaaS',
    description: '156% pipeline in 90 days',
    image: ''
  });
  Storage.addPortfolioItem({
    title: 'Trial-to-paid',
    subtitle: 'PLG SaaS',
    description: '89% lift in 60 days',
    image: ''
  });
  Storage.addPortfolioItem({
    title: 'Churn reduction',
    subtitle: 'Vertical SaaS',
    description: '41% lower churn in 120 days',
    image: ''
  });
}

function initModal(items) {
  const modal = document.getElementById('portfolio-modal');
  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');
  const img = document.getElementById('modalImage');
  const title = document.getElementById('modalTitle');
  const subtitle = document.getElementById('modalSubtitle');
  const desc = document.getElementById('modalDesc');
  const prev = document.getElementById('modalPrev');
  const next = document.getElementById('modalNext');
  let idx = 0;
  function show(i) {
    idx = i;
    const item = items[idx];
    img.src = item.image || '';
    img.alt = item.title;
    title.textContent = item.title;
    subtitle.textContent = item.subtitle || '';
    desc.textContent = item.description || '';
  }
  function open(i) {
    show(i);
    modal.hidden = false;
    modal.querySelector('.modal__content').focus();
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  prev.addEventListener('click', () => show((idx - 1 + items.length) % items.length));
  next.addEventListener('click', () => show((idx + 1) % items.length));
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev.click();
    if (e.key === 'ArrowRight') next.click();
  });
  return { open };
}

function renderGrid() {
  ensureSeed();
  const items = Storage.getPortfolio().sort((a, b) => a.order - b.order);
  const grid = document.getElementById('portfolio-grid');
  grid.innerHTML = '';
  const modal = initModal(items);
  items.forEach((item, i) => {
    const card = el('button', { class: 'portfolio-card', 'aria-haspopup': 'dialog' });
    const img = el('img', { class: 'portfolio-card__img', src: item.image || '', alt: item.title, loading: 'lazy' });
    const title = el('h3', { class: 'portfolio-card__title', text: item.title });
    const subtitle = el('p', { class: 'portfolio-card__subtitle', text: item.subtitle || '' });
    const desc = el('p', { class: 'portfolio-card__desc', text: (item.description || '').slice(0, 120) });
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(desc);
    card.addEventListener('click', () => modal.open(i));
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderGrid);

