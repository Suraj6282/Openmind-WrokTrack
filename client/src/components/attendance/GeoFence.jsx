import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateDistance } from '../../utils/geoCalculation';
import { COMPANY_LOCATION, GEO_FENCE_RADIUS } from '../../utils/constants';

const GeoFence = ({ onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = { lat: latitude, lng: longitude };
        setLocation(userLocation);
        
        const distance = calculateDistance(
          userLocation,
          COMPANY_LOCATION
        );
        
        const withinRadius = distance <= GEO_FENCE_RADIUS;
        setIsWithinRadius(withinRadius);
        
        onLocationUpdate?.({
          location: userLocation,
          isWithinRadius: withinRadius,
          distance
        });
        
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${
          isWithinRadius ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <MapPin className={`w-6 h-6 ${
            isWithinRadius ? 'text-green-600' : 'text-red-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Location Status</h3>
          
          {error ? (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-2">
                {isWithinRadius ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">
                      You are within the geo-fence
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 text-sm font-medium">
                      You are outside the geo-fence
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Required radius: {GEO_FENCE_RADIUS} meters
              </p>
              {location && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </>
          )}
        </div>
        
        <button
          onClick={getLocation}
          className="btn-secondary text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default GeoFence;