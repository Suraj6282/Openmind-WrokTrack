import React from 'react';
import { LogIn, LogOut, MapPin, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const CheckInOut = ({ attendance, onCheckIn, onCheckOut, isWithinRadius }) => {
  const isCheckedIn = attendance?.checkIn && !attendance?.checkOut;
  const isCheckedOut = attendance?.checkOut;

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h3 className="text-lg font-semibold mb-1">Attendance Action</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isCheckedOut 
              ? "You've completed your day" 
              : isCheckedIn 
              ? "You're currently checked in" 
              : "Start your work day"}
          </p>
        </div>

        <div className="flex space-x-3">
          {!isCheckedIn && !isCheckedOut && (
            <Button
              onClick={onCheckIn}
              disabled={!isWithinRadius}
              icon={LogIn}
              variant="primary"
            >
              Check In
            </Button>
          )}

          {isCheckedIn && !isCheckedOut && (
            <Button
              onClick={onCheckOut}
              disabled={!isWithinRadius}
              icon={LogOut}
              variant="secondary"
            >
              Check Out
            </Button>
          )}
        </div>
      </div>

      {!isWithinRadius && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <MapPin className="w-4 h-4" />
          <span>You must be within the office geo-fence to check in/out</span>
        </div>
      )}

      {attendance?.isLate && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>You're {attendance.lateMinutes} minutes late today</span>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;