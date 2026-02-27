import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import AnalyticsCards from './AnalyticsCards';
import Charts from './Charts';
import { getDashboardStats, getAttendanceTrends } from '../../services/analytics';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, trendsData] = await Promise.all([
        getDashboardStats(),
        getAttendanceTrends()
      ]);
      setStats(statsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        <AnalyticsCards stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Attendance Trends</h3>
          <Charts type="line" data={trends} />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <Charts type="pie" data={stats?.departmentDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'check-in' ? 'bg-green-100' :
                  activity.type === 'check-out' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'check-in' ? <UserCheck className="w-4 h-4 text-green-600" /> :
                   activity.type === 'check-out' ? <UserX className="w-4 h-4 text-red-600" /> :
                   <Clock className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.employee}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Present Today</span>
              <span className="font-semibold">{stats?.presentToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">On Leave</span>
              <span className="font-semibold">{stats?.onLeave || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Late Arrivals</span>
              <span className="font-semibold text-yellow-600">{stats?.lateToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Overtime Today</span>
              <span className="font-semibold text-green-600">{stats?.overtimeToday || 0}h</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-3">Pending Approvals</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Leave Requests</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {stats?.pendingLeaves || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Unverified Attendance</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {stats?.unverifiedAttendance || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;