/**
 * Urban Flow - Core Script & Map Controller
 * Provides toast notifications, user session display,
 * Leaflet map initializations, Nominatim city geocoding, and UI interactions.
 */

/* ============================================================
   Landing Page — Feature Detail Modal
   ------------------------------------------------------------
   Backs the 4 "Click to inspect feature" cards on index.html.
   Content mirrors real numbers used elsewhere in the app (Patiala's
   default stats, the 87% ML accuracy figure, the A-D tracked roads,
   the 60s green-wave extension) so it reads as part of the same
   system instead of made-up marketing copy.
   ============================================================ */
const FEATURE_DETAILS = {
  traffic: {
    icon: '🚦',
    badge: 'LIVE MONITORING',
    title: 'Real-time Traffic',
    description: 'Continuously tracks live vehicle counts, approach speeds, and lane density across every mapped crossroad in the city. That live snapshot feeds straight into the routing engine and the adaptive signal controller, so a jam is caught the moment it starts forming — not minutes after commuters are already stuck in it.',
    stats: [
      { val: '3', lbl: 'High-traffic roads (Patiala)' },
      { val: '18 min', lbl: 'Avg. city ETA' },
      { val: '4', lbl: 'Active incident reports' }
    ],
    actionText: 'Open Live Map',
    actionLink: 'login.html'
  },
  prediction: {
    icon: '🧠',
    badge: 'ML FORECASTING',
    title: 'AI Traffic Prediction',
    description: 'A supervised learning model trained on historical vehicle density and peak-hour patterns forecasts congestion up to 60 minutes ahead on each tracked corridor, so route suggestions and signal plans account for the jam that’s about to happen — not just the one that already has.',
    stats: [
      { val: '87%', lbl: 'Model accuracy' },
      { val: '60 min', lbl: 'Forecast horizon' },
      { val: '4', lbl: 'Corridors tracked (A–D)' }
    ],
    actionText: 'View ML Dashboard',
    actionLink: 'login.html'
  },
  routing: {
    icon: '📍',
    badge: 'GRAPH ALGORITHMS',
    title: 'Route Optimization',
    description: 'Computes Fastest, Shortest, and Avoid-Tolls alternatives using traffic-weighted Dijkstra and A* over the city’s road graph, factoring in live incidents. Route geometry is pulled from live road-routing data, so the path shown actually follows real streets instead of a straight line across the map.',
    stats: [
      { val: '3', lbl: 'Route alternatives' },
      { val: 'A*/Dijkstra', lbl: 'Core algorithms' },
      { val: 'Live', lbl: 'Road-accurate geometry' }
    ],
    actionText: 'Plan a Route',
    actionLink: 'login.html'
  },
  emergency: {
    icon: '🚑',
    badge: 'GREEN-WAVE PREEMPTION',
    title: 'Emergency Response',
    description: 'Ambulance, fire, and police requests are matched to the nearest response base and given an automated green-wave corridor: connected signals along the route extend their green phase by up to 60 seconds and hold cross-street traffic, so the unit clears every junction without stopping.',
    stats: [
      { val: '60s', lbl: 'Max green extension' },
      { val: '3', lbl: 'Vehicle types supported' },
      { val: 'Live', lbl: 'Corridor tracking' }
    ],
    actionText: 'Request Emergency SOS',
    actionLink: 'login.html'
  }
};

function openFeatureModal(key) {
  const data = FEATURE_DETAILS[key];
  const backdrop = document.getElementById('featureModalBackdrop');
  if (!data || !backdrop) return;

  document.getElementById('modalIcon').textContent = data.icon;
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalBadge').textContent = data.badge;
  document.getElementById('modalDescription').textContent = data.description;

  document.getElementById('modalStatsBox').innerHTML = data.stats.map(s => `
    <div>
      <div class="m-stat-val">${ufEscapeHtml(s.val)}</div>
      <div class="m-stat-lbl">${ufEscapeHtml(s.lbl)}</div>
    </div>
  `).join('');

  const actionBtn = document.getElementById('modalActionBtn');
  actionBtn.setAttribute('href', data.actionLink);
  actionBtn.innerHTML = `${ufEscapeHtml(data.actionText)} <i class="fa-solid fa-arrow-right"></i>`;

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFeatureModal() {
  const backdrop = document.getElementById('featureModalBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFeatureModal();
});

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
  initNotificationBell();
});

function updateNavUser() {
  const user = window.UrbanFlowData ? window.UrbanFlowData.getCurrentUser() : null;
  if (!user) return;

  const nameEl = document.getElementById('navUserName');
  const roleEl = document.getElementById('navUserRole');
  const avatarEl = document.getElementById('navUserAvatar');
  const modeEl = document.getElementById('navUserModeLabel');

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
  if (modeEl) {
    modeEl.textContent = getRoleModeLabel(user.role);
  }
}

function getRoleModeLabel(role) {
  if (role === 'traffic_manager') return 'Traffic Authority Mode';
  if (role === 'admin') return 'Administrator Mode';
  return 'Commuter Mode';
}

// Clicking the username badge opens a small account menu (current mode +
// Log Out), like the account dropdown on most sites, instead of a bare
// logout icon sitting next to the name.
function toggleUserMenu(e) {
  e.stopPropagation();
  const wrap = e.currentTarget.closest('.user-menu-wrap');
  if (!wrap) return;
  const willOpen = !wrap.classList.contains('open');
  document.querySelectorAll('.user-menu-wrap.open').forEach(w => w.classList.remove('open'));
  if (willOpen) wrap.classList.add('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.user-menu-wrap.open').forEach(w => w.classList.remove('open'));
  document.querySelectorAll('.notif-wrap.open').forEach(w => w.classList.remove('open'));
});

/* ============================================================
   Shared Notification Bell — Live Road Incident Feed
   ------------------------------------------------------------
   Injected next to the user badge on every logged-in dashboard page
   (anywhere .user-menu-wrap exists — the landing page and login screen
   have no user badge, so no bell). Reads the same shared incident store
   report-incident.html writes to, so an accident, roadwork, or blockage
   reported from any page shows up here for everyone, from wherever they
   are in the app — not just on the incident-reporting screen itself.
   ============================================================ */
const NOTIF_TYPE_ICON = {
  'Accident': '💥',
  'Roadwork': '🚧',
  'Breakdown': '🚗',
  'Signal Failure': '🚦',
  'Road Blockage': '⛔'
};
const NOTIF_STATUS_PRIORITY = { 'Reported': 0, 'In Progress': 1, 'Verified': 2 };

let notifPollInterval = null;

function initNotificationBell() {
  const userMenuWrap = document.querySelector('.user-menu-wrap');
  if (!userMenuWrap || document.getElementById('notifBellWrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'notif-wrap';
  wrap.id = 'notifBellWrap';
  wrap.innerHTML = `
    <button type="button" class="notif-bell-btn" id="notifBellBtn" aria-label="Road incident notifications">
      <i class="fa-solid fa-bell"></i>
      <span class="notif-badge-count" id="notifBadgeCount" style="display:none;">0</span>
    </button>
    <div class="notif-dropdown" id="notifDropdown">
      <div class="notif-dropdown-header">Active Road Incidents</div>
      <div id="notifList"></div>
      <div class="notif-dropdown-footer">
        <a href="report-incident.html">Report an Incident</a>
      </div>
    </div>
  `;

  userMenuWrap.parentNode.insertBefore(wrap, userMenuWrap);

  document.getElementById('notifBellBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !wrap.classList.contains('open');
    document.querySelectorAll('.notif-wrap.open, .user-menu-wrap.open').forEach(w => w.classList.remove('open'));
    if (willOpen) {
      wrap.classList.add('open');
      renderNotifBell();
    }
  });

  // Clicking inside the dropdown shouldn't bubble up and immediately close it
  wrap.querySelector('.notif-dropdown').addEventListener('click', (e) => e.stopPropagation());

  renderNotifBell();

  // Keep the badge fresh without a page reload — the report could have come
  // from another tab/page in the same browser.
  if (notifPollInterval) clearInterval(notifPollInterval);
  notifPollInterval = setInterval(renderNotifBell, 6000);
}

function renderNotifBell() {
  if (!window.UrbanFlowData) return;
  const listEl = document.getElementById('notifList');
  const badgeEl = document.getElementById('notifBadgeCount');
  if (!listEl || !badgeEl) return;

  // "Active" = not yet resolved — a road that's currently blocked, being
  // worked on, or where something just happened, is exactly what someone
  // needs a heads-up about before they drive into it.
  const incidents = window.UrbanFlowData.getIncidents()
    .filter(inc => inc.status !== 'Resolved')
    .sort((a, b) => (NOTIF_STATUS_PRIORITY[a.status] ?? 3) - (NOTIF_STATUS_PRIORITY[b.status] ?? 3));

  badgeEl.textContent = incidents.length > 9 ? '9+' : String(incidents.length);
  badgeEl.style.display = incidents.length ? 'flex' : 'none';

  if (!incidents.length) {
    listEl.innerHTML = '<div class="notif-empty">✅ No active road incidents right now.</div>';
    return;
  }

  listEl.innerHTML = incidents.map(inc => {
    const sevClass = (inc.severity || 'minor').toLowerCase();
    const icon = NOTIF_TYPE_ICON[inc.type] || '⚠️';
    return `
      <div class="notif-item">
        <div class="notif-item-icon">${icon}</div>
        <div>
          <div class="notif-item-title">${ufEscapeHtml(inc.title || inc.type)}</div>
          <div class="notif-item-meta"><i class="fa-solid fa-location-dot"></i> ${ufEscapeHtml(inc.road || 'City Road')} &bull; ${ufEscapeHtml(inc.reportedAt || 'Recent')}</div>
          <div class="notif-item-badges">
            <span class="severity-pill ${sevClass}">${ufEscapeHtml(inc.severity || 'Minor')}</span>
            <span class="severity-pill" style="background:rgba(255,255,255,0.08); color:#D1D5DB;">${ufEscapeHtml(inc.status || 'Reported')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Leaflet map helper
function createLeafletMap(containerId, lat, lon, zoom = 13) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (!window.L) {
    // Leaflet failed to load (CDN unreachable, offline, blocked, etc.)
    // Show a visible reason instead of leaving a silent blank panel.
    console.error('UrbanFlow: Leaflet library (window.L) is not available — map cannot be initialized. Check your internet connection or whether https://unpkg.com is reachable/blocked.');
    container.innerHTML = `
      <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#94A3B8; text-align:center; padding:20px;">
        <span style="font-size:28px;">⚠️</span>
        <strong style="color:#fff;">Map failed to load</strong>
        <span style="font-size:13px; max-width:320px;">The map library (Leaflet) couldn't be fetched. Check your internet connection, or that unpkg.com isn't blocked by an ad-blocker/network filter, then reload the page.</span>
      </div>`;
    return null;
  }

  const map = L.map(containerId, {
    zoomControl: true,
    attributionControl: false
  }).setView([lat, lon], zoom);

  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Surface tile-loading failures too (e.g. tile.openstreetmap.org blocked)
  // instead of leaving the user staring at a map with no tiles.
  let tileErrorShown = false;
  tileLayer.on('tileerror', () => {
    if (tileErrorShown) return;
    tileErrorShown = true;
    console.error('UrbanFlow: Map tiles failed to load from tile.openstreetmap.org — likely blocked by your network/ad-blocker.');
    showToast('Map tiles unavailable', 'Could not reach the map tile server. Check your internet connection or network filtering.', 6000);
  });

  // Leaflet measures its container's size the instant it's created. If that
  // happens before the page's own layout has settled (webfonts swapping in,
  // grid/flex columns still resolving, the panel sitting inside a card that
  // hasn't finished painting), it can lock in a 0-size or stale size and the
  // map is left blank — no error, just an empty tinted panel — until
  // something forces Leaflet to re-measure. Force that re-check shortly
  // after creation, and again whenever the window resizes.
  setTimeout(() => map.invalidateSize(), 250);
  window.addEventListener('resize', () => map.invalidateSize());

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

// Haversine distance in km between two [lat, lon] points
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Point at fraction `t` along the line from a to b, nudged sideways by
// `offsetKm` (perpendicular to the line). Used to bow alternate route
// polylines away from the straight line so they read as distinct paths.
function bowPoint(a, b, t, offsetKm) {
  const lat = a[0] + (b[0] - a[0]) * t;
  const lon = a[1] + (b[1] - a[1]) * t;
  const dLat = b[0] - a[0];
  const dLon = b[1] - a[1];
  const len = Math.sqrt(dLat * dLat + dLon * dLon) || 1;
  const perpLat = -dLon / len;
  const perpLon = dLat / len;
  const kmPerDegLat = 111;
  const kmPerDegLon = 111 * Math.cos(a[0] * Math.PI / 180);
  return [
    lat + (perpLat * offsetKm) / kmPerDegLat,
    lon + (perpLon * offsetKm) / kmPerDegLon
  ];
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

// Resolve an arbitrary place/address string to [lat, lon] coordinates for
// routing. Checks the local landmark list first (instant, offline), then
// falls back to a live OpenStreetMap Nominatim lookup so any real address
// the user types still resolves to its true location.
async function geocodePlace(query, cityKey) {
  const local = window.UrbanFlowData ? window.UrbanFlowData.findPlaceCoords(query, cityKey) : null;
  const knownLandmark = window.UrbanFlowData && window.UrbanFlowData.LANDMARKS.some(
    l => l.name.toLowerCase() === (query || '').trim().toLowerCase() ||
         l.name.toLowerCase().includes((query || '').trim().toLowerCase())
  );
  if (knownLandmark && local) return local;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (err) {
    // network unavailable — fall through to local/offset fallback
  }

  return local;
}

// Fetches real, road-following route geometry between two [lat, lon] points
// from OSRM's public routing API, instead of a straight/bowed line drawn
// through fields and buildings. Returns an array of
// { pathCoords: [[lat,lon], ...], distanceKm, durationMin } — one entry per
// alternative OSRM found (often just one) — or null if the routing service
// couldn't be reached, so callers can fall back to an approximate path.
async function fetchRoadRoutes(fromCoord, toCoord) {
  const url = `https://router.project-osrm.org/route/v1/driving/`
    + `${fromCoord[1]},${fromCoord[0]};${toCoord[1]},${toCoord[0]}`
    + `?overview=full&geometries=geojson&alternatives=true&steps=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM responded with ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
      throw new Error('OSRM returned no routes');
    }

    return data.routes.map(route => ({
      pathCoords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60
    }));
  } catch (err) {
    console.error('UrbanFlow: Live road routing (OSRM) unavailable — falling back to an approximate path.', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
