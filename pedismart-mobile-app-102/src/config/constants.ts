// API configuration - Production (Render.com)
//export const API_URL = 'https://pedismart-server-deploy102.onrender.com';
//export const API_AUTH_URL = `${API_URL}/api/auth`;
//export const API_RIDE_URL = `${API_URL}/ride`;

// Socket configuration - Production (Render.com)
//export const SOCKET_URL = 'wss://pedismart-server-deploy102.onrender.com';

// For local development, uncomment these lines:
export const API_URL = 'http://localhost:3000';
export const SOCKET_URL = 'http://localhost:3000';

// Ride status constants
export const RIDE_STATUS = {
  SEARCHING: 'SEARCHING_FOR_RIDER',
  START: 'START',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  SOCKET_REFRESH: 3000,
  API_BACKUP_REFRESH: 5000,
  LOCATION_UPDATE: 10000,
};

// Default location (Digos City, Davao Del Sur, Philippines)
export const DEFAULT_LOCATION = {
  latitude: 6.7499,
  longitude: 125.3575,
  address: "Digos City, Davao Del Sur, Philippines (Fallback)",
  heading: 0,
};
