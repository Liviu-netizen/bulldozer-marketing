const STORAGE_KEY_BOOKINGS = 'bulldozer_bookings';
const STORAGE_KEY_PORTFOLIO = 'bulldozer_portfolio';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch (_) { return fallback; }
}

export const Storage = {
  getBookings() {
    const data = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    return safeParse(data, []);
  },
  addBooking(booking) {
    const list = Storage.getBookings();
    const id = Date.now().toString();
    const record = { id, ...booking };
    list.push(record);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(list));
    return record;
  },
  getBookingsByDate(dateStr) {
    return Storage.getBookings().filter(b => b.date === dateStr);
  },
  getPortfolio() {
    const data = localStorage.getItem(STORAGE_KEY_PORTFOLIO);
    return safeParse(data, []);
  },
  addPortfolioItem(item) {
    const list = Storage.getPortfolio();
    const id = Date.now().toString();
    const record = { id, order: list.length, ...item };
    list.push(record);
    localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(list));
    return record;
  },
  updatePortfolioItem(id, updates) {
    const list = Storage.getPortfolio();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(list));
    return list[idx];
  },
  deletePortfolioItem(id) {
    let list = Storage.getPortfolio();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(list));
    return true;
  },
  reorderPortfolio(idsInOrder) {
    const list = Storage.getPortfolio();
    const map = new Map(list.map(i => [i.id, i]));
    const reordered = idsInOrder.map((id, idx) => ({ ...map.get(id), order: idx }));
    localStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(reordered));
    return reordered;
  }
};

