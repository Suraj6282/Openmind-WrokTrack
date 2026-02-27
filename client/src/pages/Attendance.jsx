import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import GeoFence from '../components/attendance/GeoFence';
import CheckInOut from '../components/attendance/CheckInOut';
import BreakTimer from '../components/attendance/BreakTimer';
import AttendanceBoard from '../components/attendance/AttendanceBoard';
import useAuth from '../hooks/useAuth';
import { checkIn, checkOut, startBreak, endBreak, getTodayAttendance } from '../services/attendance';
import { saveOfflineAttendance, getOfflineAttendance } from '../services/offlineStorage';
import { getDeviceId } from '../utils/helpers';

const Attendance = () => {
  const { user } = useAuth();
  const [locationStatus, setLocationStatus] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    fetchTodayAttendance();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      if (isOnline) {
        const response = await getTodayAttendance();
        // The API returns { status: 'success', data: { attendance } }
        setAttendance(response?.data?.attendance || null);
      } else {
        const offlineData = await getOfflineAttendance();
        setAttendance(offlineData);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!locationStatus?.isWithinRadius) {
      toast.error('You must be within the geo-fence to check in');
      return;
    }

    try {
      const deviceId = await getDeviceId();
      const checkInData = {
        timestamp: new Date(),
        location: locationStatus.location,
        deviceId
      };

      if (isOnline) {
        const response = await checkIn(checkInData);
        // The API returns { status: 'success', data: { attendance } }
        setAttendance(response?.data?.attendance || null);
        toast.success('Check-in successful');
        // Refresh attendance data
        await fetchTodayAttendance();
      } else {
        await saveOfflineAttendance({ type: 'CHECK_IN', data: checkInData });
        toast.success('Check-in saved offline. Will sync when online.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    if (!locationStatus?.isWithinRadius) {
      toast.error('You must be within the geo-fence to check out');
      return;
    }

    try {
      const deviceId = await getDeviceId();
      const checkOutData = {
        timestamp: new Date(),
        location: locationStatus.location,
        deviceId
      };

      if (isOnline) {
        const response = await checkOut(checkOutData);
        // The API returns { status: 'success', data: { attendance } }
        setAttendance(response?.data?.attendance || null);
        toast.success('Check-out successful');
        // Refresh attendance data
        await fetchTodayAttendance();
      } else {
        await saveOfflineAttendance({ type: 'CHECK_OUT', data: checkOutData });
        toast.success('Check-out saved offline. Will sync when online.');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error.message || 'Failed to check out');
    }
  };

  const handleBreakStart = async () => {
    try {
      const breakData = {
        timestamp: new Date(),
        location: locationStatus.location
      };

      if (isOnline) {
        const response = await startBreak(breakData);
        // The API returns { status: 'success', data: { attendance } }
        setAttendance(response?.data?.attendance || null);
        toast.success('Break started');
      } else {
        await saveOfflineAttendance({ type: 'BREAK_START', data: breakData });
        toast.success('Break start saved offline');
      }
    } catch (error) {
      toast.error('Failed to start break');
    }
  };

  const handleBreakEnd = async () => {
    try {
      const breakData = {
        timestamp: new Date(),
        location: locationStatus.location
      };

      if (isOnline) {
        const response = await endBreak(breakData);
        // The API returns { status: 'success', data: { attendance } }
        setAttendance(response?.data?.attendance || null);
        toast.success('Break ended');
      } else {
        await saveOfflineAttendance({ type: 'BREAK_END', data: breakData });
        toast.success('Break end saved offline');
      }
    } catch (error) {
      toast.error('Failed to end break');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance</h1>
        {!isOnline && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            Offline Mode
          </span>
        )}
      </div>

      <GeoFence onLocationUpdate={setLocationStatus} />

      <CheckInOut
        attendance={attendance}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        isWithinRadius={locationStatus?.isWithinRadius}
      />

      {attendance?.checkedIn && (
        <BreakTimer
          attendance={attendance}
          onBreakStart={handleBreakStart}
          onBreakEnd={handleBreakEnd}
        />
      )}

      <AttendanceBoard attendance={attendance} />
    </motion.div>
  );
};

export default Attendance;