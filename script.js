/**
 * Urban Flow - Core Script & Map Controller
 * Provides toast notifications, user session display,
 * Leaflet map initializations, Nominatim city geocoding, and UI interactions.
 */

// Toast notification helper
function showToast(title, message, duration = 4500) {
  let container = document.getElementById('globalToast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'globalToast';
    container.className = 'toast-container';
    container.innerHTML = `
      <div class="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-content">
          <h4 id="toastTitle">Success</h4>
          <p id="toastMessage">Action completed successfully.</p>
        </div>
        <button class="toast-close" onclick="closeToast()">&times;</button>
      </div>
    `;
    document.body.appendChild(container);
  }

  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMessage').textContent = message;

  requestAnimationFrame(() => {
    container.classList.add('show');
  });

  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    closeToast();
  }, duration);
}

function closeToast() {
  const container = document.getElementById('globalToast');
  if (container) {
    container.classList.remove('show');
  }
}

// Check on page load if login toast needs to be shown
document.addEventListener('DOMContentLoaded', () => {
  if (window.UrbanFlowData && window.UrbanFlowData.shouldShowLoginToast) {
    if (window.UrbanFlowData.shouldShowLoginToast()) {
      const user = window.UrbanFlowData.getCurrentUser();
      showToast(
        'Login Successful!',
        `Welcome back, ${user.displayName || user.username}! Ready to manage smart urban traffic.`
      );
    }
  }

  // Update navbar user pill if elements exist
  updateNavUser();
});

function updateNavUser() {
  const user = window.UrbanFlowData ? window.UrbanFlowData.getCurrentUser() : null;
  if (!user) return;

  const nameEl = document.getElementById('navUserName');
  const roleEl = document.getElementById('navUserRole');
  const avatarEl = document.getElementById('navUserAvatar');

  // Name and initial always come from whoever signed in
  const fullName = user.displayName || user.username || 'Guest';

  if (nameEl) nameEl.textContent = fullName.split(' ')[0];
  if (roleEl) {
    if (user.role === 'traffic_manager') roleEl.textContent = 'Traffic Authority';
    else if (user.role === 'admin') roleEl.textContent = 'System Admin';
    else roleEl.textContent = 'Commuter';
  }
  if (avatarEl) {
    avatarEl.textContent = fullName.charAt(0).toUpperCase();
  }
}

// Leaflet map helper
function createLeafletMap(containerId, lat, lon, zoom = 13) {
  if (!window.L || !document.getElementById(containerId)) return null;

  const map = L.map(containerId, {
    zoomControl: true,
    attributionControl: false
  }).setView([lat, lon], zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

// Custom Leaflet Icons
function createCustomPin(color = '#7C3AED', label = '📍') {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

/* ============================================================
   Reusable Option Dropdown (Combobox) for text input bars
   ------------------------------------------------------------
   Turns a plain <input type="text"> into a searchable dropdown:
   focus / click / caret shows the full option list, typing filters
   it, arrow keys + Enter pick one. Free typing still works.

   attachOptionDropdown('someInputId', {
     options: [{ value, label, icon, badge, note, group }] | (query) => [...],
     onSelect: (item, input) => { ... },
     noMatch: (query) => item | null,   // fallback row when nothing matches
     emptyText: 'No matching options',
     openOnFocus: true,
     maxItems: 60
   });
   ============================================================ */
function ufEscapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function attachOptionDropdown(target, config = {}) {
  const input = typeof target === 'string' ? document.getElementById(target) : target;
  if (!input || input.dataset.ufCombo === 'true') return null;

  const settings = Object.assign({
    options: [],
    onSelect: null,
    noMatch: null,
    emptyText: 'No matching options',
    openOnFocus: true,
    filter: true,
    maxItems: 60
  }, config);

  input.dataset.ufCombo = 'true';
  input.setAttribute('autocomplete', 'off');
  input.classList.add('uf-combo-input');

  // Wrap the existing input so the panel can be positioned against it
  const wrapper = document.createElement('div');
  wrapper.className = 'uf-combo';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const caret = document.createElement('button');
  caret.type = 'button';
  caret.className = 'uf-combo-caret';
  caret.tabIndex = -1;
  caret.setAttribute('aria-label', 'Show options');
  caret.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  wrapper.appendChild(caret);

  const panel = document.createElement('div');
  panel.className = 'suggestions-dropdown uf-combo-panel';
  panel.id = (input.id || 'ufCombo' + Math.floor(Math.random() * 10000)) + 'Options';
  panel.setAttribute('role', 'listbox');
  wrapper.appendChild(panel);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', panel.id);

  let items = [];
  let activeIndex = -1;
  let isOpen = false;

  function resolveOptions(query) {
    const raw = typeof settings.options === 'function' ? settings.options(query) : settings.options;
    return Array.isArray(raw) ? raw : [];
  }

  function matches(item, q) {
    if (!q) return true;
    const hay = [item.label, item.value, item.badge, item.note, item.group, item.keywords]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function highlight(text, q) {
    const safe = ufEscapeHtml(text);
    if (!q) return safe;
    const rx = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return safe.replace(rx, '<mark class="uf-combo-mark">$1</mark>');
  }

  function render(query) {
    const raw = query == null ? '' : String(query);
    const q = raw.trim().toLowerCase();

    let list = resolveOptions(raw);
    if (settings.filter) list = list.filter(item => matches(item, q));
    list = list.slice(0, settings.maxItems);

    if (!list.length && typeof settings.noMatch === 'function') {
      const fallback = settings.noMatch(raw.trim());
      if (fallback) list = [fallback];
    }

    items = list;
    activeIndex = -1;
    panel.innerHTML = '';
    input.removeAttribute('aria-activedescendant');

    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'uf-combo-empty';
      empty.textContent = settings.emptyText;
      panel.appendChild(empty);
      return;
    }

    let lastGroup = null;
    list.forEach((item, index) => {
      if (item.group && item.group !== lastGroup) {
        lastGroup = item.group;
        const head = document.createElement('div');
        head.className = 'uf-combo-group';
        head.textContent = item.group;
        panel.appendChild(head);
      }

      const row = document.createElement('div');
      row.className = 'suggestion-item';
      row.id = panel.id + '-opt-' + index;
      row.dataset.index = String(index);
      row.setAttribute('role', 'option');
      row.innerHTML = `
        <div class="sugg-left">
          <span class="sugg-icon">${ufEscapeHtml(item.icon || '📍')}</span>
          <span class="sugg-text">
            ${highlight(item.label || item.value || '', q)}
            ${item.note ? `<span class="sugg-note">${ufEscapeHtml(item.note)}</span>` : ''}
          </span>
        </div>
        ${item.badge ? `<span class="sugg-badge">${ufEscapeHtml(item.badge)}</span>` : ''}
      `;
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        choose(index);
      });
      row.addEventListener('mousemove', () => setActive(index));
      panel.appendChild(row);
    });
  }

  function setActive(index) {
    panel.querySelectorAll('[data-index]').forEach(r => r.classList.remove('active'));
    activeIndex = index;
    const row = panel.querySelector(`[data-index="${index}"]`);
    if (!row) return;

    row.classList.add('active');
    input.setAttribute('aria-activedescendant', row.id);

    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < panel.scrollTop) panel.scrollTop = top;
    else if (bottom > panel.scrollTop + panel.clientHeight) panel.scrollTop = bottom - panel.clientHeight;
  }

  function open(query) {
    render(query == null ? input.value : query);
    panel.classList.add('open');
    wrapper.classList.add('open');
    isOpen = true;
    input.setAttribute('aria-expanded', 'true');
  }

  function close() {
    panel.classList.remove('open');
    wrapper.classList.remove('open');
    isOpen = false;
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function choose(index) {
    const item = items[index];
    if (!item) return;
    input.value = item.value !== undefined ? item.value : (item.label || '');
    close();
    if (typeof settings.onSelect === 'function') settings.onSelect(item, input);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Typing filters the list; focus / click / caret shows everything
  input.addEventListener('input', () => open(input.value));

  input.addEventListener('focus', () => {
    if (settings.openOnFocus) open('');
  });

  input.addEventListener('click', () => {
    if (!isOpen) open('');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) return open('');
      if (items.length) setActive(activeIndex + 1 >= items.length ? 0 : activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) return open('');
      if (items.length) setActive(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0) {
        e.preventDefault();
        choose(activeIndex);
      } else {
        close();
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        close();
      }
    } else if (e.key === 'Tab') {
      close();
    }
  });

  caret.addEventListener('mousedown', (e) => e.preventDefault());
  caret.addEventListener('click', () => {
    if (isOpen) {
      close();
    } else {
      input.focus();
      open('');
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  return {
    input,
    wrapper,
    open: (q) => open(q == null ? '' : q),
    close,
    refresh: () => { if (isOpen) render(input.value); },
    setOptions: (next) => { settings.options = next; if (isOpen) render(input.value); }
  };
}

// Geocoding helper for city search
async function geocodeCity(query, onSuccess, onError) {
  const clean = (query || '').trim();
  if (!clean) return;

  // Check preset cities first
  const key = clean.toLowerCase();
  if (window.UrbanFlowData && window.UrbanFlowData.CITIES[key]) {
    onSuccess(window.UrbanFlowData.CITIES[key]);
    return;
  }

  // Fallback to OpenStreetMap Nominatim API
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(clean)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const place = data[0];
      const cityData = {
        name: clean,
        fullName: place.display_name.split(',').slice(0, 2).join(','),
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        zoom: 13,
        highTrafficRoads: 4 + Math.floor(Math.random() * 8),
        avgEta: `${20 + Math.floor(Math.random() * 25)} min`,
        mlAccuracy: 84 + Math.floor(Math.random() * 10),
        incidentReports: 3 + Math.floor(Math.random() * 10),
        fromDefault: `${clean} Center`,
        toDefault: `${clean} Express Junction`
      };
      onSuccess(cityData);
    } else {
      if (onError) onError(`Could not find "${clean}". Try another city name.`);
    }
  } catch (err) {
    if (onError) onError('Network error reaching map service. Using fallback coordinates.');
  }
}
