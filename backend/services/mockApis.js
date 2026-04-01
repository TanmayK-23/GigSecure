/**
 * Mock External API Data Sources
 * These simulate real-world APIs (Weather, Platform Health, Civic Alerts, etc.)
 * returning time-varying data to make the demo feel alive.
 */

// ── 1. Weather API (OpenWeatherMap-style) ─────────────────────────
function getWeatherData(zone = 'andheri') {
  const profiles = {
    andheri:  { base_rain: 18, flood_risk: 0.6 },
    bandra:   { base_rain: 12, flood_risk: 0.3 },
    kurla:    { base_rain: 22, flood_risk: 0.7 },
    dharavi:  { base_rain: 25, flood_risk: 0.8 },
    powai:    { base_rain: 8,  flood_risk: 0.15 },
  };
  const p = profiles[zone.toLowerCase()] || profiles.andheri;
  const hour = new Date().getHours();
  // Rain heavier in afternoon (12-18)
  const timeFactor = (hour >= 12 && hour <= 18) ? 1.8 : 0.7;
  const rainfall_mm = Math.round(p.base_rain * timeFactor * (0.8 + Math.random() * 0.4));
  return {
    zone,
    rainfall_mm,
    temperature_c: Math.round(28 + Math.random() * 10),
    humidity: Math.round(60 + Math.random() * 30),
    wind_kmh: Math.round(5 + Math.random() * 25),
    alert: rainfall_mm > 25 ? 'heavy_rain' : null,
    timestamp: new Date().toISOString(),
  };
}

// ── 2. Platform Health (Swiggy/Blinkit/Zepto status) ──────────────
function getPlatformStatus() {
  // ~10% chance of outage during demo
  const roll = Math.random();
  const isOutage = roll < 0.10;
  return {
    platform: ['Swiggy Instamart', 'Blinkit', 'Zepto'][Math.floor(Math.random() * 3)],
    status: isOutage ? 'outage' : 'operational',
    affected_zones: isOutage ? ['Andheri West', 'Kurla'] : [],
    downtime_minutes: isOutage ? Math.round(30 + Math.random() * 90) : 0,
    timestamp: new Date().toISOString(),
  };
}

// ── 3. Civic Alert (Zone Curfew / Road Closure) ───────────────────
function getCivicAlert() {
  // ~8% chance of active curfew
  const roll = Math.random();
  const isActive = roll < 0.08;
  const zones = ['Dharavi', 'Kurla', 'Andheri West'];
  return {
    type: 'civic_alert',
    status: isActive ? 'closed' : 'open',
    zone: zones[Math.floor(Math.random() * zones.length)],
    reason: isActive ? 'Area curfew due to civil unrest' : null,
    timestamp: new Date().toISOString(),
  };
}

// ── 4. Extreme Heat Advisory ──────────────────────────────────────
function getHeatAdvisory() {
  const temp = Math.round(32 + Math.random() * 14); // 32-46°C
  return {
    type: 'heat_advisory',
    temperature_c: temp,
    alert: temp > 42 ? 'extreme_heat' : null,
    advisory: temp > 42 ? 'IMD Red Alert: Avoid outdoor activity' : null,
    timestamp: new Date().toISOString(),
  };
}

// ── 5. Flood Level Monitor ────────────────────────────────────────
function getFloodLevel() {
  const zones = ['Andheri West', 'Kurla', 'Dharavi'];
  const zone = zones[Math.floor(Math.random() * zones.length)];
  const level_cm = Math.round(Math.random() * 80); // 0-80 cm
  return {
    type: 'flood_monitor',
    zone,
    water_level_cm: level_cm,
    alert: level_cm > 45 ? 'flood_alert' : null,
    passable: level_cm <= 30,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  getWeatherData,
  getPlatformStatus,
  getCivicAlert,
  getHeatAdvisory,
  getFloodLevel,
};
