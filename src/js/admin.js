import { Storage } from './storage.js';

const PASS = 'BULLDOZER2025SRLpass';

function qs(id) { return document.getElementById(id); }

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderItems() {
  const list = Storage.getPortfolio().sort((a, b) => a.order - b.order);
  const container = qs('itemsList');
  container.innerHTML = '';
  list.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    const title = document.createElement('span');
    title.textContent = item.title;
    const up = document.createElement('button');
    up.textContent = '↑';
    const down = document.createElement('button');
    down.textContent = '↓';
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    const del = document.createElement('button');
    del.textContent = 'Delete';
    up.addEventListener('click', () => {
      const ids = list.map(i => i.id);
      if (idx > 0) [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      Storage.reorderPortfolio(ids);
      renderItems();
    });
    down.addEventListener('click', () => {
      const ids = list.map(i => i.id);
      if (idx < ids.length - 1) [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
      Storage.reorderPortfolio(ids);
      renderItems();
    });
    edit.addEventListener('click', () => {
      qs('itemTitle').value = item.title || '';
      qs('itemSubtitle').value = item.subtitle || '';
      qs('itemDesc').innerHTML = item.description || '';
      const hiddenId = document.createElement('input');
      hiddenId.type = 'hidden';
      hiddenId.id = 'editingId';
      hiddenId.value = item.id;
      document.getElementById('itemForm').appendChild(hiddenId);
    });
    del.addEventListener('click', () => {
      const ok = window.confirm('Delete this item?');
      if (!ok) return;
      Storage.deletePortfolioItem(item.id);
      renderItems();
    });
    row.appendChild(title);
    row.appendChild(up);
    row.appendChild(down);
    row.appendChild(edit);
    row.appendChild(del);
    container.appendChild(row);
  });
}

function initLogin() {
  const form = qs('loginForm');
  const feedback = qs('loginFeedback');
  const panel = qs('admin-panel');
  const login = document.getElementById('admin-login');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = qs('adminPassword').value;
    if (val === PASS) {
      login.hidden = true;
      panel.hidden = false;
      renderItems();
    } else {
      feedback.textContent = 'Incorrect password.';
      feedback.className = 'calendar__feedback calendar__feedback--error';
    }
  });
}

function initEditor() {
  const toolbar = document.querySelectorAll('.wys-toolbar button');
  toolbar.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      document.execCommand(cmd);
    });
  });
  const form = document.getElementById('itemForm');
  const previewBtn = qs('previewBtn');
  const previewPanel = qs('previewPanel');
  previewBtn.addEventListener('click', () => {
    qs('previewTitle').textContent = qs('itemTitle').value;
    qs('previewSubtitle').textContent = qs('itemSubtitle').value;
    qs('previewDesc').innerHTML = qs('itemDesc').innerHTML;
    const file = qs('itemImage').files[0];
    if (file) {
      toBase64(file).then(data => {
        qs('previewImage').src = data;
      });
    }
    previewPanel.hidden = false;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = qs('itemTitle').value.trim();
    if (!title) return;
    const subtitle = qs('itemSubtitle').value.trim();
    const description = qs('itemDesc').innerHTML.trim();
    const file = qs('itemImage').files[0];
    let image = '';
    if (file) image = await toBase64(file);
    const editing = document.getElementById('editingId');
    if (editing) {
      Storage.updatePortfolioItem(editing.value, { title, subtitle, description, image });
      editing.remove();
    } else {
      Storage.addPortfolioItem({ title, subtitle, description, image });
    }
    form.reset();
    qs('itemDesc').innerHTML = '';
    previewPanel.hidden = true;
    renderItems();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initEditor();
});

