/**
 * UrbanFlow — time-of-day traffic simulation
 * ------------------------------------------
 * Separate from the static seed data in data.js. Uses the device clock
 * (`new Date()`) to pick a period, then scales existing intersection /
 * ML tables deterministically. This is a pattern simulation, not live
 * sensors or a traffic API.
 */
const UrbanFlowTimeSim = (() => {
  const PERIODS = [
    {
      id: 'morning_peak',
      label: 'Morning Peak',
      startHour: 6,
      endHour: 9,
      cycleAdj: 12,
      volume: 1.00,
      dirScale: { north: 0.88, south: 1.14, east: 0.70, west: 0.92 },
      tier: 'Morning inbound peak (simulated)',
      ml: [
        { current: 'High', predicted: 'High', confidence: '93%', trend: 'Sustained (+10%)', peakTime: '08:15 AM' },
        { current: 'Medium', predicted: 'High', confidence: '90%', trend: 'Rising (+18%)', peakTime: '08:40 AM' },
        { current: 'High', predicted: 'Severe', confidence: '94%', trend: 'Inbound surge (+32%)', peakTime: '08:00 AM' },
        { current: 'Medium', predicted: 'Medium', confidence: '87%', trend: 'Stable (+4%)', peakTime: '09:00 AM' }
      ]
    },
    {
      id: 'morning_normal',
      label: 'Morning/Normal',
      startHour: 9,
      endHour: 12,
      cycleAdj: -8,
      volume: 0.68,
      dirScale: { north: 1.00, south: 0.96, east: 0.90, west: 0.88 },
      tier: 'Off-peak morning flow (simulated)',
      ml: [
        { current: 'Medium', predicted: 'Medium', confidence: '88%', trend: 'Easing (-14%)', peakTime: '11:30 AM' },
        { current: 'Low', predicted: 'Medium', confidence: '86%', trend: 'Slight Rise (+8%)', peakTime: '12:00 PM' },
        { current: 'Medium', predicted: 'Medium', confidence: '90%', trend: 'Stable (-5%)', peakTime: '12:15 PM' },
        { current: 'Low', predicted: 'Low', confidence: '91%', trend: 'Stable (0%)', peakTime: '12:00 PM' }
      ]
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      startHour: 12,
      endHour: 16,
      cycleAdj: -2,
      volume: 0.78,
      dirScale: { north: 0.92, south: 0.90, east: 1.12, west: 1.08 },
      tier: 'Afternoon commercial mix (simulated)',
      ml: [
        { current: 'Medium', predicted: 'High', confidence: '89%', trend: 'Building (+16%)', peakTime: '05:00 PM' },
        { current: 'Medium', predicted: 'Medium', confidence: '87%', trend: 'Slight Rise (+9%)', peakTime: '05:30 PM' },
        { current: 'High', predicted: 'High', confidence: '91%', trend: 'Holding (+6%)', peakTime: '04:45 PM' },
        { current: 'Medium', predicted: 'Medium', confidence: '88%', trend: 'Shopping traffic (+11%)', peakTime: '04:00 PM' }
      ]
    },
    {
      id: 'evening_peak',
      label: 'Evening Peak',
      startHour: 16,
      endHour: 19,
      cycleAdj: 15,
      volume: 1.00,
      dirScale: { north: 1.00, south: 1.00, east: 1.00, west: 1.00 },
      tier: 'Evening outbound peak (simulated)',
      ml: [
        { current: 'Medium', predicted: 'High', confidence: '92%', trend: 'Increasing (+28%)', peakTime: '05:30 PM' },
        { current: 'Low', predicted: 'Medium', confidence: '89%', trend: 'Slight Rise (+12%)', peakTime: '06:00 PM' },
        { current: 'High', predicted: 'Severe', confidence: '95%', trend: 'Rapid Rise (+45%)', peakTime: '05:15 PM' },
        { current: 'Low', predicted: 'Low', confidence: '88%', trend: 'Stable (-2%)', peakTime: '07:30 PM' }
      ]
    },
    {
      id: 'evening',
      label: 'Evening',
      startHour: 19,
      endHour: 22,
      cycleAdj: -4,
      volume: 0.72,
      dirScale: { north: 0.95, south: 0.90, east: 1.05, west: 1.00 },
      tier: 'Evening decay after peak (simulated)',
      ml: [
        { current: 'High', predicted: 'Medium', confidence: '90%', trend: 'Easing (-18%)', peakTime: '07:45 PM' },
        { current: 'Medium', predicted: 'Low', confidence: '88%', trend: 'Declining (-15%)', peakTime: '08:30 PM' },
        { current: 'High', predicted: 'Medium', confidence: '92%', trend: 'Clearing (-22%)', peakTime: '08:00 PM' },
        { current: 'Low', predicted: 'Low', confidence: '89%', trend: 'Stable (-3%)', peakTime: '09:00 PM' }
      ]
    },
    {
      id: 'night',
      label: 'Night',
      startHour: 22,
      endHour: 6,
      wrapsMidnight: true,
      cycleAdj: -28,
      volume: 0.32,
      dirScale: { north: 1.05, south: 1.00, east: 0.55, west: 0.50 },
      tier: 'Overnight low volume (simulated)',
      ml: [
        { current: 'Low', predicted: 'Low', confidence: '91%', trend: 'Overnight low (-40%)', peakTime: '06:30 AM' },
        { current: 'Low', predicted: 'Low', confidence: '90%', trend: 'Stable (-8%)', peakTime: '07:00 AM' },
        { current: 'Low', predicted: 'Medium', confidence: '86%', trend: 'Freight trickle (+6%)', peakTime: '06:00 AM' },
        { current: 'Low', predicted: 'Low', confidence: '93%', trend: 'Quiet (-12%)', peakTime: '07:30 AM' }
      ]
    }
  ];

  function getClock(date) {
    return date instanceof Date ? date : new Date();
  }

  function hourInPeriod(hour, period) {
    if (period.wrapsMidnight) {
      return hour >= period.startHour || hour < period.endHour;
    }
    return hour >= period.startHour && hour < period.endHour;
  }

  function getCurrentPeriod(date) {
    const now = getClock(date);
    const hour = now.getHours();
    return PERIODS.find(p => hourInPeriod(hour, p)) || PERIODS[3];
  }

  function formatClock(date) {
    const now = getClock(date);
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const mm = minutes < 10 ? '0' + minutes : String(minutes);
    return hours + ':' + mm + ' ' + ampm;
  }

  function getPeriodHeadline(date) {
    const now = getClock(date);
    const period = getCurrentPeriod(now);
    return 'Current Traffic Period: ' + period.label + ' (' + formatClock(now) + ')';
  }

  function scaleCount(base, dir, period) {
    const dirScale = period.dirScale[dir] != null ? period.dirScale[dir] : 1;
    return Math.max(8, Math.round(base * period.volume * dirScale));
  }

  function scaleCycle(baseCycle, period) {
    const next = (baseCycle || 110) + period.cycleAdj;
    return Math.max(70, Math.min(150, next));
  }

  function greensFromDemand(vehicles, approaches, cycleLength) {
    const dirs = approaches && approaches.length ? approaches : Object.keys(vehicles);
    const minGreen = dirs.length === 3 ? 12 : 10;
    const total = dirs.reduce((sum, d) => sum + (vehicles[d] || 0), 0) || 1;
    const maxGreen = Math.max(minGreen + 5, cycleLength - minGreen * (dirs.length - 1));

    const greens = {};
    let allocated = 0;
    dirs.forEach((dir, idx) => {
      if (idx === dirs.length - 1) {
        greens[dir] = Math.max(minGreen, Math.min(maxGreen, cycleLength - allocated));
        return;
      }
      const share = (vehicles[dir] || 0) / total;
      const g = Math.max(minGreen, Math.min(maxGreen, Math.round(share * cycleLength)));
      greens[dir] = g;
      allocated += g;
    });
    return greens;
  }

  function applyToIntersection(intersection, date) {
    const period = getCurrentPeriod(date);
    const baseVehicles = intersection._baseVehicles || intersection.vehicles || {};
    const approaches = intersection.approaches || Object.keys(baseVehicles);
    const vehicles = {};
    approaches.forEach(dir => {
      vehicles[dir] = scaleCount(baseVehicles[dir] || 0, dir, period);
    });
    const cycleLength = scaleCycle(intersection._baseCycle || intersection.cycleLength, period);
    return Object.assign({}, intersection, {
      _baseVehicles: baseVehicles,
      _baseCycle: intersection._baseCycle || intersection.cycleLength,
      vehicles,
      cycleLength,
      trafficTier: period.tier,
      periodId: period.id,
      periodLabel: period.label
    });
  }

  function getMlPredictions(date) {
    const period = getCurrentPeriod(date);
    const roads = (window.UrbanFlowData && window.UrbanFlowData.ML_PREDICTIONS) || [];
    return roads.map((row, i) => Object.assign({}, row, period.ml[i] || {}));
  }

  return {
    PERIODS,
    getCurrentPeriod,
    formatClock,
    getPeriodHeadline,
    applyToIntersection,
    greensFromDemand,
    getMlPredictions
  };
})();

window.UrbanFlowTimeSim = UrbanFlowTimeSim;
