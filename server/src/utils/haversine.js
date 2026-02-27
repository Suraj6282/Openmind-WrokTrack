/**
 * Calculate the distance between two points on Earth using Haversine formula
 * @param {Object} point1 - { lat: number, lng: number }
 * @param {Object} point2 - { lat: number, lng: number }
 * @returns {number} Distance in meters
 */
exports.calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Calculate distance in kilometers
 * @param {Object} point1 - { lat: number, lng: number }
 * @param {Object} point2 - { lat: number, lng: number }
 * @returns {number} Distance in kilometers
 */
exports.calculateDistanceKm = (point1, point2) => {
  return exports.calculateDistance(point1, point2) / 1000;
};

/**
 * Check if a point is within a given radius of another point
 * @param {Object} point - { lat: number, lng: number }
 * @param {Object} center - { lat: number, lng: number }
 * @param {number} radius - Radius in meters
 * @returns {boolean}
 */
exports.isWithinRadius = (point, center, radius) => {
  const distance = exports.calculateDistance(point, center);
  return distance <= radius;
};

/**
 * Generate a random point within a given radius of a center point
 * @param {Object} center - { lat: number, lng: number }
 * @param {number} radius - Radius in meters
 * @returns {Object} { lat: number, lng: number }
 */
exports.generateRandomPoint = (center, radius) => {
  const R = 6371e3; // Earth's radius in meters
  
  // Convert radius to radians
  const radiusInRadians = radius / R;
  
  // Random angle
  const angle = Math.random() * Math.PI * 2;
  
  // Random distance within radius (using square root for uniform distribution)
  const distance = Math.sqrt(Math.random()) * radiusInRadians;
  
  // Calculate new coordinates
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance) +
    Math.cos(lat1) * Math.sin(distance) * Math.cos(angle)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(angle) * Math.sin(distance) * Math.cos(lat1),
    Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI
  };
};

/**
 * Calculate bounding box coordinates
 * @param {Object} center - { lat: number, lng: number }
 * @param {number} radius - Radius in meters
 * @returns {Object} { minLat, maxLat, minLng, maxLng }
 */
exports.getBoundingBox = (center, radius) => {
  const R = 6371e3; // Earth's radius in meters
  
  // Angular radius in radians
  const radDist = radius / R;
  const radLat = (center.lat * Math.PI) / 180;
  const radLng = (center.lng * Math.PI) / 180;
  
  let minLat = radLat - radDist;
  let maxLat = radLat + radDist;
  
  let minLng, maxLng;
  
  if (minLat > -Math.PI / 2 && maxLat < Math.PI / 2) {
    const deltaLng = Math.asin(Math.sin(radDist) / Math.cos(radLat));
    minLng = radLng - deltaLng;
    maxLng = radLng + deltaLng;
    
    if (minLng < -Math.PI) minLng += 2 * Math.PI;
    if (maxLng > Math.PI) maxLng -= 2 * Math.PI;
  } else {
    // Near the poles
    minLat = Math.max(minLat, -Math.PI / 2);
    maxLat = Math.min(maxLat, Math.PI / 2);
    minLng = -Math.PI;
    maxLng = Math.PI;
  }
  
  return {
    minLat: (minLat * 180) / Math.PI,
    maxLat: (maxLat * 180) / Math.PI,
    minLng: (minLng * 180) / Math.PI,
    maxLng: (maxLng * 180) / Math.PI
  };
};

/**
 * Calculate bearing between two points
 * @param {Object} start - { lat: number, lng: number }
 * @param {Object} end - { lat: number, lng: number }
 * @returns {number} Bearing in degrees
 */
exports.calculateBearing = (start, end) => {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;
  
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
};

/**
 * Calculate midpoint between two points
 * @param {Object} point1 - { lat: number, lng: number }
 * @param {Object} point2 - { lat: number, lng: number }
 * @returns {Object} { lat: number, lng: number }
 */
exports.calculateMidpoint = (point1, point2) => {
  const lat1 = (point1.lat * Math.PI) / 180;
  const lon1 = (point1.lng * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const lon2 = (point2.lng * Math.PI) / 180;
  
  const bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const by = Math.cos(lat2) * Math.sin(lon2 - lon1);
  
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by)
  );
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx);
  
  return {
    lat: (lat3 * 180) / Math.PI,
    lng: (lon3 * 180) / Math.PI
  };
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
exports.toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} degrees
 */
exports.toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};