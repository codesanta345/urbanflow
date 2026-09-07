/**
 * Urban Flow - Shared Data Store & State Management
 * Handles mock database, user sessions, preset city data,
 * route graph algorithms, live incidents, signal timings, and ML predictions.
 */

const UrbanFlowData = (() => {
  // Key names for LocalStorage
  const STORAGE_KEYS = {
    USER: 'uf_current_user',
    INCIDENTS: 'uf_incidents',
    SIGNALS: 'uf_signals',
    ACTIVE_EMERGENCY: 'uf_emergency',
    SELECTED_CITY: 'uf_selected_city',
    LAST_ROUTE_QUERY: 'uf_last_route_query',
    TOAST_FLAG: 'uf_show_login_toast'
  };

  // Demo user credentials with distinct roles
  const USERS = [
    { username: 'user', password: 'user123', role: 'user', displayName: 'Divya Chaudhary', roleTitle: 'Commuter / Driver', email: 'divya@urbanflow.io' },
    { username: 'traffic_manager', password: 'traffic123', role: 'traffic_manager', displayName: 'Agrim Bhatt', roleTitle: 'Traffic Authority Officer', email: 'agrim.manager@urbanflow.io' },
    { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Shruti', roleTitle: 'System Administrator', email: 'shruti.admin@urbanflow.io' }
  ];

  // Comprehensive Landmarks & Places for Instant Autocomplete Suggestions
  const LANDMARKS = [
    // Patiala Landmarks
    { name: 'Thapar University Main Gate, Patiala', category: 'Campus', icon: '🏫', city: 'patiala' },
    { name: 'Thapar University Hostel Block J, Patiala', category: 'Campus', icon: '🏫', city: 'patiala' },
    { name: 'Patiala Bus Stand, Near Railway Road', category: 'Transit', icon: '🚌', city: 'patiala' },
    { name: 'Patiala Railway Station, Station Rd', category: 'Transit', icon: '🚆', city: 'patiala' },
    { name: 'Phase 7 Chowk, Urban Estate, Patiala', category: 'Intersection', icon: '🚦', city: 'patiala' },
    { name: 'Rajindra Hospital & Medical College, Patiala', category: 'Hospital', icon: '🏥', city: 'patiala' },
    { name: 'Leela Bhawan Market, Patiala', category: 'Commercial', icon: '🛍️', city: 'patiala' },
    { name: 'Model Town Main Market, Patiala', category: 'Commercial', icon: '🛍️', city: 'patiala' },
    { name: 'Baradari Gardens, Patiala', category: 'Park', icon: '🌳', city: 'patiala' },
    { name: 'Punjabi University Campus, Patiala', category: 'Campus', icon: '🏫', city: 'patiala' },
    { name: 'Bypass Road Exit 2, Patiala', category: 'Highway', icon: '🛣️', city: 'patiala' },
    { name: 'Fountain Chowk, Lower Mall Rd, Patiala', category: 'Intersection', icon: '🚦', city: 'patiala' },
    { name: 'Omaxe Mall, Mall Road, Patiala', category: 'Shopping', icon: '🏬', city: 'patiala' },
    { name: 'Modi College Chowk, Patiala', category: 'Intersection', icon: '🚦', city: 'patiala' },
    { name: 'Urban Estate Phase 2 Market, Patiala', category: 'Residential', icon: '🏘️', city: 'patiala' },

    // Chandigarh Landmarks
    { name: 'Sector 17 Plaza, Chandigarh', category: 'Commercial', icon: '🛍️', city: 'chandigarh' },
    { name: 'Elante Mall, Industrial Area Phase 1, Chandigarh', category: 'Shopping', icon: '🏬', city: 'chandigarh' },
    { name: 'PGI Hospital (PGIMER), Sector 12, Chandigarh', category: 'Hospital', icon: '🏥', city: 'chandigarh' },
    { name: 'Sukhna Lake Promenade, Chandigarh', category: 'Tourist', icon: '⛵', city: 'chandigarh' },
    { name: 'ISBT Sector 43 Bus Terminus, Chandigarh', category: 'Transit', icon: '🚌', city: 'chandigarh' },
    { name: 'ISBT Sector 17 Bus Stand, Chandigarh', category: 'Transit', icon: '🚌', city: 'chandigarh' },
    { name: 'Panjab University (PU) Campus, Chandigarh', category: 'Campus', icon: '🏫', city: 'chandigarh' },
    { name: 'Tribune Chowk, Chandigarh', category: 'Intersection', icon: '🚦', city: 'chandigarh' },

    // Delhi NCR Landmarks
    { name: 'Connaught Place (Inner Circle), New Delhi', category: 'Commercial', icon: '🏛️', city: 'delhi' },
    { name: 'Indira Gandhi International Airport (T3), Delhi', category: 'Airport', icon: '✈️', city: 'delhi' },
    { name: 'New Delhi Railway Station (Paharganj Side)', category: 'Transit', icon: '🚆', city: 'delhi' },
    { name: 'AIIMS Hospital, Ansari Nagar, New Delhi', category: 'Hospital', icon: '🏥', city: 'delhi' },
    { name: 'India Gate, Rajpath, New Delhi', category: 'Monument', icon: '🏛️', city: 'delhi' },
    { name: 'Cyber Hub, DLF Phase 2, Gurugram', category: 'IT Park', icon: '🏢', city: 'delhi' },
    { name: 'Dhaula Kuan Intersection, Ring Road, Delhi', category: 'Intersection', icon: '🚦', city: 'delhi' },
    { name: 'Kashmere Gate ISBT, Delhi', category: 'Transit', icon: '🚌', city: 'delhi' },

    // Ludhiana & Amritsar Landmarks
    { name: 'Clock Tower (Ghanta Ghar), Ludhiana', category: 'Landmark', icon: '🕰️', city: 'ludhiana' },
    { name: 'PAU (Punjab Agricultural University) Gate 2, Ludhiana', category: 'Campus', icon: '🏫', city: 'ludhiana' },
    { name: 'Golden Temple (Harmandir Sahib), Amritsar', category: 'Heritage', icon: '✨', city: 'amritsar' },
    { name: 'Amritsar Junction Railway Station', category: 'Transit', icon: '🚆', city: 'amritsar' },

    // Mumbai & Bangalore Landmarks
    { name: 'Bandra Kurla Complex (BKC), Mumbai', category: 'Business', icon: '💼', city: 'mumbai' },
    { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai', category: 'Transit', icon: '🚆', city: 'mumbai' },
    { name: 'Marine Drive Promenade, South Mumbai', category: 'Tourist', icon: '🌊', city: 'mumbai' },
    { name: 'Electronic City Phase 1 (Toll Gate), Bengaluru', category: 'Tech Park', icon: '🏢', city: 'bangalore' },
    { name: 'Indiranagar 100ft Road, Bengaluru', category: 'Commercial', icon: '🛍️', city: 'bangalore' },
    { name: 'Kempegowda International Airport, Bengaluru', category: 'Airport', icon: '✈️', city: 'bangalore' }
  ];

  // Preset cities with coordinates and traffic metrics
  const CITIES = {
    'patiala': {
      name: 'Patiala',
      state: 'Punjab',
      fullName: 'Patiala, Punjab',
      lat: 30.3398,
      lon: 76.3869,
      zoom: 13,
      highTrafficRoads: 3,
      avgEta: '18 min',
      mlAccuracy: 87,
      incidentReports: 4,
      fromDefault: 'Thapar University Main Gate, Patiala',
      toDefault: 'Patiala Bus Stand, Near Railway Road'
    },
    'chandigarh': {
      name: 'Chandigarh',
      state: 'UT',
      fullName: 'Chandigarh, Tri-City',
      lat: 30.7333,
      lon: 76.7794,
      zoom: 13,
      highTrafficRoads: 5,
      avgEta: '19 min',
      mlAccuracy: 91,
      incidentReports: 6,
      fromDefault: 'Sector 17 Plaza, Chandigarh',
      toDefault: 'Elante Mall, Industrial Area Phase 1, Chandigarh'
    },
    'delhi': {
      name: 'Delhi',
      state: 'Delhi NCR',
      fullName: 'New Delhi, NCR',
      lat: 28.6139,
      lon: 77.2090,
      zoom: 12,
      highTrafficRoads: 14,
      avgEta: '42 min',
      mlAccuracy: 84,
      incidentReports: 19,
      fromDefault: 'Connaught Place (Inner Circle), New Delhi',
      toDefault: 'Indira Gandhi International Airport (T3), Delhi'
    },
    'ludhiana': {
      name: 'Ludhiana',
      state: 'Punjab',
      fullName: 'Ludhiana, Punjab',
      lat: 30.9010,
      lon: 75.8573,
      zoom: 13,
      highTrafficRoads: 7,
      avgEta: '26 min',
      mlAccuracy: 85,
      incidentReports: 8,
      fromDefault: 'Clock Tower (Ghanta Ghar), Ludhiana',
      toDefault: 'PAU (Punjab Agricultural University) Gate 2, Ludhiana'
    },
    'amritsar': {
      name: 'Amritsar',
      state: 'Punjab',
      fullName: 'Amritsar, Punjab',
      lat: 31.6340,
      lon: 74.8723,
      zoom: 13,
      highTrafficRoads: 4,
      avgEta: '22 min',
      mlAccuracy: 88,
      incidentReports: 5,
      fromDefault: 'Golden Temple (Harmandir Sahib), Amritsar',
      toDefault: 'Amritsar Junction Railway Station'
    },
    'mumbai': {
      name: 'Mumbai',
      state: 'Maharashtra',
      fullName: 'Mumbai, Maharashtra',
      lat: 19.0760,
      lon: 72.8777,
      zoom: 12,
      highTrafficRoads: 18,
      avgEta: '52 min',
      mlAccuracy: 81,
      incidentReports: 28,
      fromDefault: 'Bandra Kurla Complex (BKC), Mumbai',
      toDefault: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai'
    },
    'bangalore': {
      name: 'Bangalore',
      state: 'Karnataka',
      fullName: 'Bengaluru, Karnataka',
      lat: 12.9716,
      lon: 77.5946,
      zoom: 12,
      highTrafficRoads: 16,
      avgEta: '48 min',
      mlAccuracy: 83,
      incidentReports: 22,
      fromDefault: 'Indiranagar 100ft Road, Bengaluru',
      toDefault: 'Electronic City Phase 1 (Toll Gate), Bengaluru'
    }
  };

  // Seed Incidents
  const DEFAULT_INCIDENTS = [
    {
      id: 'INC-101',
      title: 'Accident at Phase 7 Chowk',
      type: 'Accident',
      severity: 'Critical',
      road: 'Phase 7 Chowk / Bypass Junction',
      city: 'Patiala',
      reportedAt: '12 mins ago',
      reportedBy: 'Traffic Patrol 04',
      status: 'Verified',
      description: 'Two-vehicle collision causing lane obstruction. Emergency services dispatched.',
      delayImpact: '+12 min delay'
    },
    {
      id: 'INC-102',
      title: 'Roadwork & Pipe Repair',
      type: 'Roadwork',
      severity: 'Moderate',
      road: 'Lower Mall Road near Baradari',
      city: 'Patiala',
      reportedAt: '35 mins ago',
      reportedBy: 'Municipal Corp',
      status: 'In Progress',
      description: 'Single lane closed for water line maintenance until 6:00 PM.',
      delayImpact: '+6 min delay'
    },
    {
      id: 'INC-103',
      title: 'Vehicle Breakdown on Flyover',
      type: 'Breakdown',
      severity: 'Minor',
      road: 'Bypass Road Exit 3',
      city: 'Patiala',
      reportedAt: '48 mins ago',
      reportedBy: 'Citizen User #218',
      status: 'Reported',
      description: 'Stalled truck on shoulder lane. Recovery crane requested.',
      delayImpact: '+4 min delay'
    },
    {
      id: 'INC-104',
      title: 'Traffic Signal Malfunction',
      type: 'Signal Failure',
      severity: 'Critical',
      road: 'Rajpura Road Junction',
      city: 'Patiala',
      reportedAt: '1 hour ago',
      reportedBy: 'Police Control Room',
      status: 'Verified',
      description: 'Signal stuck on flashing yellow. Manual traffic directing in progress.',
      delayImpact: '+15 min delay'
    }
  ];

  // Smart Signal Data (Figure 5 in PDF)
  const DEFAULT_SIGNALS = {
    intersectionName: 'Phase 7 - Central Interchange',
    cycleLength: 110,
    approaches: {
      north: { direction: 'North', vehicleCount: 800, currentGreen: 45, recommendedGreen: 48, status: 'Heavy', queueLength: '120m' },
      south: { direction: 'South', vehicleCount: 650, currentGreen: 35, recommendedGreen: 37, status: 'Moderate-High', queueLength: '85m' },
      east:  { direction: 'East',  vehicleCount: 200, currentGreen: 15, recommendedGreen: 13, status: 'Low-Moderate', queueLength: '30m' },
      west:  { direction: 'West',  vehicleCount: 150, currentGreen: 15, recommendedGreen: 12, status: 'Low', queueLength: '20m' }
    },
    emergencyPreemption: false,
    emergencyApproach: null
  };

  // ML Predictions Data (Figure 7 in PDF)
  const ML_PREDICTIONS = [
    { road: 'Road A (Phase 7 Chowk)', current: 'Medium', predicted: 'High', confidence: '92%', trend: 'Increasing (+28%)', peakTime: '05:30 PM' },
    { road: 'Road B (Urban Estate Ring)', current: 'Low', predicted: 'Medium', confidence: '89%', trend: 'Slight Rise (+12%)', peakTime: '06:00 PM' },
    { road: 'Road C (Main Bypass)', current: 'High', predicted: 'Severe', confidence: '95%', trend: 'Rapid Rise (+45%)', peakTime: '05:15 PM' },
    { road: 'Road D (Mall Road)', current: 'Low', predicted: 'Low', confidence: '88%', trend: 'Stable (-2%)', peakTime: '07:30 PM' }
  ];

  // Route comparisons (Dijkstra / A*)
  const ROUTE_COMPARISONS = {
    fastest: {
      id: 'route-a',
      name: 'Route A (Recommended)',
      tag: 'RECOMMENDED - FASTEST',
      distance: '7.2 km',
      estTime: '16 min',
      totalTime: '16 min',
      trafficCondition: 'Moderate Traffic',
      trafficColor: '#f59e0b',
      savings: '8 mins faster than Route C',
      waypoints: ['Thapar University Main Gate', 'Phase 7 Chowk', 'Bypass Road Exit 2', 'Patiala Bus Stand Arrival'],
      toll: false,
      algorithm: 'Dijkstra / A* (Traffic-Weighted)',
      costScore: 18.4,
      pathCoords: [
        [30.3544, 76.3688],
        [30.3475, 76.3750],
        [30.3412, 76.3815],
        [30.3340, 76.3890],
        [30.3298, 76.3980]
      ]
    },
    shortest: {
      id: 'route-b',
      name: 'Route B (Shortest Distance)',
      tag: 'SHORTEST DISTANCE',
      distance: '6.4 km',
      estTime: '21 min',
      totalTime: '21 min',
      trafficCondition: 'Heavy Traffic',
      trafficColor: '#ef4444',
      savings: 'Saves 0.8 km distance, but heavy congestion',
      waypoints: ['Thapar University Main Gate', 'Old City Market', 'Railway Cross', 'Patiala Bus Stand Arrival'],
      toll: false,
      algorithm: 'Dijkstra (Distance-Only)',
      costScore: 24.1,
      pathCoords: [
        [30.3544, 76.3688],
        [30.3450, 76.3710],
        [30.3380, 76.3760],
        [30.3320, 76.3870],
        [30.3298, 76.3980]
      ]
    },
    avoidTolls: {
      id: 'route-c',
      name: 'Route C (Low Traffic & Toll Free)',
      tag: 'AVOID TOLLS / LEAST TRAFFIC',
      distance: '9.1 km',
      estTime: '24 min',
      totalTime: '24 min',
      trafficCondition: 'Low Traffic',
      trafficColor: '#10b981',
      savings: 'Zero tolls, open route, +8 mins',
      waypoints: ['Thapar University Main Gate', 'Outer Ring Link', 'South Peripheral Road', 'Patiala Bus Stand Arrival'],
      toll: false,
      algorithm: 'A* with Avoid-Tolls Constraint',
      costScore: 22.0,
      pathCoords: [
        [30.3544, 76.3688],
        [30.3600, 76.3790],
        [30.3510, 76.3920],
        [30.3390, 76.4050],
        [30.3298, 76.3980]
      ]
    }
  };

  // State Helpers
  function getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) return JSON.parse(stored);
      return {
        username: 'user',
        role: 'user',
        displayName: 'Divya Chaudhary',
        roleTitle: 'Commuter / Driver',
        email: 'divya@urbanflow.io'
      };
    } catch (e) {
      return {
        username: 'user',
        role: 'user',
        displayName: 'Divya Chaudhary',
        roleTitle: 'Commuter / Driver',
        email: 'divya@urbanflow.io'
      };
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  function switchRole(roleKey) {
    const match = USERS.find(u => u.role === roleKey);
    if (match) {
      setCurrentUser(match);
      return match;
    }
    return null;
  }

  function markLoginToast() {
    sessionStorage.setItem(STORAGE_KEYS.TOAST_FLAG, 'true');
  }

  function shouldShowLoginToast() {
    const show = sessionStorage.getItem(STORAGE_KEYS.TOAST_FLAG) === 'true';
    if (show) {
      sessionStorage.removeItem(STORAGE_KEYS.TOAST_FLAG);
    }
    return show;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = 'login.html';
  }

  function authenticate(userType, username, password) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPw = (password || '').trim();
    const cleanRole = (userType || '').trim().toLowerCase();

    // Check predefined
    const match = USERS.find(u =>
      u.role === cleanRole &&
      (u.username.toLowerCase() === cleanUsername || cleanUsername === u.role) &&
      u.password === cleanPw
    );

    if (match) {
      setCurrentUser(match);
      markLoginToast();
      return { success: true, user: match };
    }

    if (cleanPw.length >= 4) {
      let roleTitle = 'Commuter / Driver';
      if (cleanRole === 'traffic_manager') roleTitle = 'Traffic Authority Officer';
      if (cleanRole === 'admin') roleTitle = 'System Administrator';

      const session = {
        username: cleanUsername || 'user',
        role: cleanRole,
        displayName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
        roleTitle: roleTitle,
        email: `${cleanUsername}@urbanflow.io`,
        loginTime: new Date().toISOString()
      };
      setCurrentUser(session);
      markLoginToast();
      return { success: true, user: session };
    }

    return { success: false, message: 'Invalid credentials. Please enter a valid username and password (at least 4 characters).' };
  }

  function searchLandmarks(query, cityFilter) {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();

    return LANDMARKS.filter(item => {
      const matchCity = cityFilter ? item.city.toLowerCase() === cityFilter.toLowerCase() : true;
      const matchText = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return matchText;
    }).slice(0, 6);
  }

  function getIncidents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      return stored ? JSON.parse(stored) : DEFAULT_INCIDENTS;
    } catch (e) {
      return DEFAULT_INCIDENTS;
    }
  }

  function addIncident(incident) {
    const list = getIncidents();
    const newInc = {
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      reportedAt: 'Just now',
      status: 'Reported',
      delayImpact: '+5 to 15 min delay',
      ...incident
    };
    list.unshift(newInc);
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(list));
    return newInc;
  }

  function updateIncidentStatus(id, newStatus) {
    const list = getIncidents();
    const target = list.find(i => i.id === id);
    if (target) {
      target.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(list));
    }
    return list;
  }

  function getSignals() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIGNALS);
      return stored ? JSON.parse(stored) : DEFAULT_SIGNALS;
    } catch (e) {
      return DEFAULT_SIGNALS;
    }
  }

  function updateSignals(updated) {
    localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(updated));
  }

  function getActiveEmergency() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setEmergency(emergencyData) {
    if (emergencyData) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_EMERGENCY, JSON.stringify(emergencyData));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY);
    }
  }

  function getSelectedCityKey() {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CITY) || 'patiala';
  }

  function setSelectedCityKey(cityKey) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, cityKey);
  }

  function getCityData(key) {
    return CITIES[key] || CITIES['patiala'];
  }

  function saveRouteQuery(from, to, pref) {
    localStorage.setItem(STORAGE_KEYS.LAST_ROUTE_QUERY, JSON.stringify({ from, to, pref, timestamp: Date.now() }));
  }

  function getLastRouteQuery() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_ROUTE_QUERY);
      return stored ? JSON.parse(stored) : {
        from: 'Thapar University Main Gate, Patiala',
        to: 'Patiala Bus Stand, Near Railway Road',
        pref: 'fastest'
      };
    } catch (e) {
      return {
        from: 'Thapar University Main Gate, Patiala',
        to: 'Patiala Bus Stand, Near Railway Road',
        pref: 'fastest'
      };
    }
  }

  return {
    USERS,
    CITIES,
    LANDMARKS,
    ML_PREDICTIONS,
    ROUTE_COMPARISONS,
    getCurrentUser,
    setCurrentUser,
    switchRole,
    markLoginToast,
    shouldShowLoginToast,
    logout,
    authenticate,
    searchLandmarks,
    getIncidents,
    addIncident,
    updateIncidentStatus,
    getSignals,
    updateSignals,
    getActiveEmergency,
    setEmergency,
    getSelectedCityKey,
    setSelectedCityKey,
    getCityData,
    saveRouteQuery,
    getLastRouteQuery
  };
})();

window.UrbanFlowData = UrbanFlowData;
