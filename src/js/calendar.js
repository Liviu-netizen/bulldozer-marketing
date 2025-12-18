import { Storage } from './storage.js';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  });
  children.forEach(c => el.appendChild(c));
  return el;
}

export function initCalendar(selector) {
  const container = document.querySelector(selector);
  if (!container) return;
  const calendarRoot = createEl('div', { class: 'calendar' });
  const header = createEl('div', { class: 'calendar__header' });
  const prevBtn = createEl('button', { class: 'calendar__nav', 'aria-label': 'Previous month' }, [createEl('span', { text: '‹' })]);
  const nextBtn = createEl('button', { class: 'calendar__nav', 'aria-label': 'Next month' }, [createEl('span', { text: '›' })]);
  const monthLabel = createEl('div', { class: 'calendar__month' });
  const grid = createEl('div', { class: 'calendar__grid', role: 'grid' });
  const sidebar = createEl('div', { class: 'calendar__sidebar' });
  const slotsTitle = createEl('h3', { class: 'calendar__slots-title', text: 'Available times' });
  const slotsList = createEl('div', { class: 'calendar__slots', role: 'listbox' });
  const form = createEl('form', { class: 'calendar__form', 'aria-labelledby': 'bookingFormTitle' });
  const formTitle = createEl('h3', { id: 'bookingFormTitle', class: 'calendar__form-title', text: 'Book a call' });
  const nameGroup = createEl('div', { class: 'calendar__form-group' });
  const nameLabel = createEl('label', { for: 'bookingName', text: 'Name' });
  const nameInput = createEl('input', { id: 'bookingName', type: 'text', required: 'true', placeholder: 'Jane Smith' });
  const emailGroup = createEl('div', { class: 'calendar__form-group' });
  const emailLabel = createEl('label', { for: 'bookingEmail', text: 'Work email' });
  const emailInput = createEl('input', { id: 'bookingEmail', type: 'email', required: 'true', placeholder: 'jane@company.com' });
  const submitBtn = createEl('button', { type: 'submit', class: 'btn btn--primary btn--full' }, [createEl('span', { text: 'Confirm booking' })]);
  const feedback = createEl('div', { class: 'calendar__feedback', 'aria-live': 'polite' });
  nameGroup.appendChild(nameLabel); nameGroup.appendChild(nameInput);
  emailGroup.appendChild(emailLabel); emailGroup.appendChild(emailInput);
  form.appendChild(formTitle);
  form.appendChild(nameGroup);
  form.appendChild(emailGroup);
  form.appendChild(submitBtn);
  form.appendChild(feedback);
  sidebar.appendChild(slotsTitle);
  sidebar.appendChild(slotsList);
  sidebar.appendChild(form);
  header.appendChild(prevBtn);
  header.appendChild(monthLabel);
  header.appendChild(nextBtn);
  calendarRoot.appendChild(header);
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const headRow = createEl('div', { class: 'calendar__weekdays' });
  weekdays.forEach(d => headRow.appendChild(createEl('div', { class: 'calendar__weekday', text: d })));
  calendarRoot.appendChild(headRow);
  calendarRoot.appendChild(grid);
  const state = { current: new Date(), selectedDate: null, selectedSlot: null };
  const defaultSlots = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30'];
  function renderMonth() {
    const d = new Date(state.current.getFullYear(), state.current.getMonth(), 1);
    const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    monthLabel.textContent = monthName;
    grid.innerHTML = '';
    const startDay = d.getDay();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let i = 0; i < startDay; i++) {
      grid.appendChild(createEl('div', { class: 'calendar__cell calendar__cell--empty' }));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(d.getFullYear(), d.getMonth(), day);
      const label = `${cellDate.toLocaleString('default', { month: 'long' })} ${day}, ${cellDate.getFullYear()}`;
      const cell = createEl('button', { class: 'calendar__cell', role: 'gridcell', 'aria-selected': 'false', tabindex: '0', 'aria-label': label }, [createEl('span', { class: 'calendar__cell-day', text: String(day) })]);
      if (isSameDay(cellDate, new Date())) cell.classList.add('calendar__cell--today');
      cell.addEventListener('click', () => {
        state.selectedDate = cellDate;
        renderSlots();
        Array.from(grid.querySelectorAll('.calendar__cell')).forEach(c => c.setAttribute('aria-selected', 'false'));
        cell.setAttribute('aria-selected', 'true');
      });
      cell.addEventListener('keydown', (e) => {
        const cols = 7;
        const cells = Array.from(grid.querySelectorAll('.calendar__cell')).filter(c => !c.classList.contains('calendar__cell--empty'));
        const index = cells.indexOf(cell);
        if (e.key === 'ArrowRight') { e.preventDefault(); cells[Math.min(index + 1, cells.length - 1)].focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); cells[Math.max(index - 1, 0)].focus(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); cells[Math.min(index + cols, cells.length - 1)].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); cells[Math.max(index - cols, 0)].focus(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); }
      });
      grid.appendChild(cell);
    }
  }
  function renderSlots() {
    slotsList.innerHTML = '';
    state.selectedSlot = null;
    const dateStr = formatDate(state.selectedDate || new Date());
    const bookings = Storage.getBookingsByDate(dateStr);
    const taken = new Set(bookings.map(b => b.time));
    defaultSlots.forEach(t => {
      const disabled = taken.has(t);
      const item = createEl('button', { class: 'calendar__slot', role: 'option', 'aria-selected': 'false', tabindex: disabled ? '-1' : '0', disabled: disabled ? 'true' : '', 'aria-label': `${dateStr} at ${t}` }, [createEl('span', { text: t })]);
      item.addEventListener('click', () => {
        Array.from(slotsList.querySelectorAll('.calendar__slot')).forEach(s => s.setAttribute('aria-selected', 'false'));
        item.setAttribute('aria-selected', 'true');
        state.selectedSlot = t;
      });
      item.addEventListener('keydown', (e) => {
        const items = Array.from(slotsList.querySelectorAll('.calendar__slot')).filter(b => !b.disabled);
        const index = items.indexOf(item);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(index + 1, items.length - 1)].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(index - 1, 0)].focus(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
      slotsList.appendChild(item);
    });
  }
  prevBtn.addEventListener('click', () => {
    state.current = new Date(state.current.getFullYear(), state.current.getMonth() - 1, 1);
    renderMonth();
  });
  nextBtn.addEventListener('click', () => {
    state.current = new Date(state.current.getFullYear(), state.current.getMonth() + 1, 1);
    renderMonth();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.textContent = '';
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const date = formatDate(state.selectedDate || new Date());
    const time = state.selectedSlot;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailValid || !time) {
      feedback.textContent = 'Please select a time and enter valid details.';
      feedback.className = 'calendar__feedback calendar__feedback--error';
      return;
    }
    const booking = Storage.addBooking({ name, email, date, time });
    feedback.textContent = 'Booking confirmed.';
    feedback.className = 'calendar__feedback calendar__feedback--success';
    nameInput.value = '';
    emailInput.value = '';
    renderSlots();
  });
  container.innerHTML = '';
  container.appendChild(calendarRoot);
  renderMonth();
  state.selectedDate = new Date();
  renderSlots();
}
