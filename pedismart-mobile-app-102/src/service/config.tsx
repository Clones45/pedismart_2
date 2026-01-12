import { Platform } from "react-native";

// Local development server (UNCOMMENT AND EDIT YOUR IP HERE)
// export const BASE_URL = 'http://192.168.1.9:3000';
// export const SOCKET_URL = 'http://192.168.1.9:3000';

// Default Localhost (Works for Simulators/Emulators on same machine)
// export const BASE_URL = 'http://localhost:3000';
// export const SOCKET_URL = 'http://localhost:3000';

// Production deployment - Render.com
export const BASE_URL = 'https://pedismart-server-deploy102.onrender.com';
export const SOCKET_URL = 'wss://pedismart-server-deploy102.onrender.com';

// Alternative configurations (uncomment as needed)
// For local testing STEPHEN PISO WIFI
// export const BASE_URL = 'http://10.0.18.222:3000';
// export const SOCKET_URL = 'ws://10.0.18.222:3000';

// For iOS simulator
// export const BASE_URL = 'http://127.0.0.1:3000';
// export const SOCKET_URL = 'ws://127.0.0.1:3000';

// For local testing yellow pad WIFI
// export const BASE_URL = 'http://192.168.1.66:8081';
// export const SOCKET_URL = 'ws://192.168.1.66:8081';

// For Android emulator
// export const BASE_URL = 'http://10.0.2.2:3000';
// export const SOCKET_URL = 'ws://10.0.2.2:3000';

// ( CAFE WIFI - ALOCLYDE )
// export const BASE_URL = 'http://192.168.100.171:3000';
// export const SOCKET_URL = 'ws://192.168.100.171:3000';

// STATS WIFI 
// export const BASE_URL = 'http://192.168.137.218:3000';
// export const SOCKET_URL = 'ws://192.168.137.218:3000';

//DITO WIFI
//export const BASE_URL = 'http://192.168.250.149:3000';
//export const SOCKET_URL = 'ws://192.168.250.149:3000';

// DOGH IT WIFI
//export const BASE_URL = 'http://192.168.137.90:3000';
//export const SOCKET_URL = 'ws://192.168.137.90:3000';

// GLOBE WIFI
//export const BASE_URL = 'http://192.168.250.149:3000';
//export const SOCKET_URL = 'ws://192.168.250.149:3000';

// ============================================
// MAX DISTANCE FEATURE (Easy to enable/disable)
// ============================================
// Uncomment the line below to enable 30KM max distance filtering
// Riders beyond 30KM from passenger pickup won't see the ride
export const MAX_DISTANCE_KM = 30; // Set to null to disable: export const MAX_DISTANCE_KM = null;
// ============================================

