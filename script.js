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

  if (nameEl) nameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : user.username;
  if (roleEl) {
    if (user.role === 'traffic_manager') roleEl.textContent = 'Traffic Authority';
    else if (user.role === 'admin') roleEl.textContent = 'System Admin';
    else roleEl.textContent = 'Commuter';
  }
  if (avatarEl) {
    avatarEl.textContent = (user.username || 'U').charAt(0).toUpperCase();
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
