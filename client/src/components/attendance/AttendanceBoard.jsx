import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Coffee, AlertCircle } from 'lucide-react';

const AttendanceBoard = ({ attendance }) => {
  if (!attendance) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Attendance Record
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Check in to start tracking your attendance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today's Attendance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
              <p className="font-semibold">
                {attendance.date ? format(new Date(attendance.date), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check In</p>
              <p className="font-semibold">
                {attendance.checkIn?.time ? format(new Date(attendance.checkIn.time), 'hh:mm a') : '--:-- --'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check Out</p>
              <p className="font-semibold">
                {attendance.checkOut?.time ? format(new Date(attendance.checkOut.time), 'hh:mm a') : '--:-- --'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Coffee className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Break</p>
              <p className="font-semibold">{attendance.totalBreakDuration || 0} min</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Working Hours</p>
            <p className="text-2xl font-bold">
              {attendance.totalWorkingHours?.toFixed(1) || 0}h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overtime</p>
            <p className="text-2xl font-bold text-green-600">
              {attendance.overtime?.toFixed(1) || 0}h
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className={`text-lg font-semibold ${
              attendance.status === 'present' ? 'text-green-600' :
              attendance.status === 'late' ? 'text-yellow-600' :
              attendance.status === 'half-day' ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {attendance.status?.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Late</p>
            <p className={`text-lg font-semibold ${attendance.isLate ? 'text-red-600' : 'text-green-600'}`}>
              {attendance.isLate ? `${attendance.lateMinutes} min` : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceBoard;