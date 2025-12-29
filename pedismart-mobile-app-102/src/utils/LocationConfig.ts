// Location Configuration for PediSmart App
// This file contains default location settings that can be easily modified

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// Default current location - Digos City, Davao Del Sur
export const DEFAULT_CURRENT_LOCATION: LocationData = {
  latitude: 6.7499,
  longitude: 125.3575,
  address: "Digos City, Davao Del Sur, Philippines"
};

// Map region configuration
export const DEFAULT_MAP_REGION = {
  latitude: DEFAULT_CURRENT_LOCATION.latitude,
  longitude: DEFAULT_CURRENT_LOCATION.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Location service configuration
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
  distanceFilter: 10, // meters
};

// Function to get current default location
export const getCurrentDefaultLocation = (): LocationData => {
  return DEFAULT_CURRENT_LOCATION;
};

// Function to create a new location object
export const createLocation = (
  latitude: number, 
  longitude: number, 
  address: string = ""
): LocationData => {
  return {
    latitude,
    longitude,
    address
  };
};

// Function to calculate distance between two locations (in km)
export const calculateDistance = (
  location1: { latitude: number; longitude: number },
  location2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
  const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Predefined pin locations for easy destination selection
export interface PinLocation extends LocationData {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const PIN_LOCATIONS: PinLocation[] = [
  {
    id: 'digos-city-hall',
    name: "Digos City Hall",
    category: 'Government',
    latitude: 6.7499,
    longitude: 125.3575,
    address: "Digos City Hall, Digos City, Davao Del Sur",
    description: "Main government center of Digos City"
  },
  {
    id: 'digos-public-market',
    name: "Digos Public Market",
    category: 'Shopping',
    latitude: 6.7505,
    longitude: 125.3580,
    address: "Digos Public Market, Digos City, Davao Del Sur",
    description: "Main public market in Digos City"
  },
  {
    id: 'digos-gaisano-mall',
    name: "Gaisano Mall Digos",
    category: 'Shopping',
    latitude: 6.7485,
    longitude: 125.3590,
    address: "Gaisano Mall, Digos City, Davao Del Sur",
    description: "Major shopping mall in Digos City"
  },
  {
    id: 'digos-terminal',
    name: "Digos City Terminal",
    category: 'Transport',
    latitude: 6.7510,
    longitude: 125.3565,
    address: "Digos City Terminal, Digos City, Davao Del Sur",
    description: "Main transportation terminal in Digos City"
  },
  {
    id: 'digos-hospital',
    name: "Davao Del Sur Provincial Hospital",
    category: 'Healthcare',
    latitude: 6.7490,
    longitude: 125.3555,
    address: "Davao Del Sur Provincial Hospital, Digos City",
    description: "Main provincial hospital in Digos City"
  }
];

// Function to get all pin locations
export const getPinLocations = (): PinLocation[] => {
  return PIN_LOCATIONS;
};

// Function to get pin locations by category
export const getPinLocationsByCategory = (category: string): PinLocation[] => {
  return PIN_LOCATIONS.filter(location => location.category === category);
};

// Function to find pin location by ID
export const getPinLocationById = (id: string): PinLocation | undefined => {
  return PIN_LOCATIONS.find(location => location.id === id);
};

// Function to check if location is within Digos City bounds
export const isWithinDigosCity = (location: { latitude: number; longitude: number }): boolean => {
  // Approximate bounds for Digos City, Davao Del Sur
  const bounds = {
    north: 6.80,
    south: 6.70,
    east: 125.40,
    west: 125.30
  };
  
  return (
    location.latitude >= bounds.south &&
    location.latitude <= bounds.north &&
    location.longitude >= bounds.west &&
    location.longitude <= bounds.east
  );
};
