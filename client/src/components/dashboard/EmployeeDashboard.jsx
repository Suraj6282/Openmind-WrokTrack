import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { getMyStats, getRecentAttendance } from '../../services/analytics';
import Card from '../common/Card';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        getMyStats().catch(err => ({ data: null })),
        getRecentAttendance().catch(err => ({ data: [] }))
      ]);
      setStats(statsData?.data || statsData || {});
      setRecent(recentData?.data || recentData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set defaults instead of error
      setStats({});
      setRecent([]);
    } finally {
      setLoading(false);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Hours</p>
              <p className="text-2xl font-bold">{stats?.todayHours || 0}h</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold">{stats?.attendanceRate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Leave Balance</p>
              <p className="text-2xl font-bold">{stats?.leaveBalance || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overtime</p>
              <p className="text-2xl font-bold">{stats?.overtime || 0}h</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {recent.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{format(new Date(record.date), 'EEEE, MMM dd')}</p>
                  <p className="text-sm text-gray-500">
                    {record.checkIn ? format(new Date(record.checkIn.time), 'hh:mm a') : '--'} - 
                    {record.checkOut ? format(new Date(record.checkOut.time), 'hh:mm a') : '--'}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Upcoming Leaves</h3>
          {stats?.upcomingLeaves?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingLeaves.map((leave, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">{leave.type} Leave</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming leaves</p>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
};

export default EmployeeDashboard;