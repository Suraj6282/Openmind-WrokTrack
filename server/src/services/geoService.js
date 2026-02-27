const axios = require('axios');

class GeoService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if point is within radius
  isWithinRadius(point, center, radius) {
    const distance = this.calculateDistance(point, center);
    return distance <= radius;
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(lat, lng) {
    try {
      if (this.googleMapsApiKey) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.googleMapsApiKey}`
        );

        if (response.data.results && response.data.results.length > 0) {
          return {
            formatted: response.data.results[0].formatted_address,
            components: this.parseAddressComponents(response.data.results[0].address_components)
          };
        }
      }

      // Fallback to OpenStreetMap Nominatim
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );

      return {
        formatted: response.data.display_name,
        components: response.data.address
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        formatted: `${lat}, ${lng}`,
        components: {}
      };
    }
  }

  // Get coordinates from address (geocoding)
  async getCoordinatesFromAddress(address) {
    try {
      if (this.googleMapsApiKey) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`
        );

        if (response.data.results && response.data.results.length > 0) {
          const location = response.data.results[0].geometry.location;
          return {
            lat: location.lat,
            lng: location.lng,
            formatted: response.data.results[0].formatted_address
          };
        }
      }

      // Fallback to OpenStreetMap Nominatim
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (response.data && response.data.length > 0) {
        return {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon),
          formatted: response.data[0].display_name
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw error;
    }
  }

  // Parse address components from Google Maps response
  parseAddressComponents(components) {
    const result = {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    };

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        result.street = component.long_name + ' ' + result.street;
      }
      if (types.includes('route')) {
        result.street += component.long_name;
      }
      if (types.includes('locality')) {
        result.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      }
      if (types.includes('country')) {
        result.country = component.long_name;
      }
      if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      }
    });

    return result;
  }

  // Calculate commute distance and time
  async calculateCommute(origin, destination, mode = 'driving') {
    try {
      if (this.googleMapsApiKey) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=${mode}&key=${this.googleMapsApiKey}`
        );

        if (response.data.rows && response.data.rows[0] && response.data.rows[0].elements[0]) {
          const element = response.data.rows[0].elements[0];
          return {
            distance: element.distance.value, // in meters
            distanceText: element.distance.text,
            duration: element.duration.value, // in seconds
            durationText: element.duration.text,
            status: element.status
          };
        }
      }

      // Fallback to Haversine for straight-line distance
      const distance = this.calculateDistance(origin, destination);
      return {
        distance: distance,
        distanceText: `${(distance / 1000).toFixed(2)} km`,
        duration: distance / 20, // Rough estimate: 20 km/h average speed
        durationText: `${Math.round(distance / 333)} min`,
        status: 'OK'
      };
    } catch (error) {
      console.error('Distance matrix failed:', error);
      throw error;
    }
  }

  // Validate if location is within office premises
  async validateOfficeLocation(location, officeLocation, radius) {
    const distance = this.calculateDistance(location, officeLocation);
    
    return {
      isValid: distance <= radius,
      distance: Math.round(distance),
      requiredRadius: radius
    };
  }

  // Get timezone from coordinates
  async getTimezone(lat, lng) {
    try {
      if (this.googleMapsApiKey) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Math.floor(Date.now() / 1000)}&key=${this.googleMapsApiKey}`
        );

        return {
          timeZoneId: response.data.timeZoneId,
          timeZoneName: response.data.timeZoneName,
          rawOffset: response.data.rawOffset,
          dstOffset: response.data.dstOffset
        };
      }
    } catch (error) {
      console.error('Timezone API failed:', error);
    }

    // Fallback to system timezone
    return {
      timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeZoneName: '',
      rawOffset: new Date().getTimezoneOffset() * -60,
      dstOffset: 0
    };
  }

  // Generate a random point within radius
  generateRandomPoint(center, radius) {
    const R = 6371e3;
    const radiusInRadians = radius / R;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * radiusInRadians;
    
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
  }
}

module.exports = new GeoService();