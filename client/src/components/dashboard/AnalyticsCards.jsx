import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const AnalyticsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'blue',
      change: '+5%'
    },
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: UserCheck,
      color: 'green',
      change: `${stats?.presentPercentage || 0}%`
    },
    {
      title: 'Late Today',
      value: stats?.lateToday || 0,
      icon: Clock,
      color: 'yellow',
      change: stats?.latePercentage || '0%'
    },
    {
      title: 'On Leave',
      value: stats?.onLeave || 0,
      icon: Users,
      color: 'purple',
      change: '-2%'
    },
    {
      title: 'Monthly Salary',
      value: `₹${(stats?.monthlySalary || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      change: '+12%'
    },
    {
      title: 'Overtime Hours',
      value: `${stats?.overtimeHours || 0}h`,
      icon: TrendingUp,
      color: 'orange',
      change: '+3h'
    },
    {
      title: 'Pending Leaves',
      value: stats?.pendingLeaves || 0,
      icon: AlertCircle,
      color: 'red',
      change: 'urgent'
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: 'blue',
      change: '+2%'
    }
  ];

  return (
    <>
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-lg`}>
              <card.icon className={`w-5 h-5 text-${card.color}-600`} />
            </div>
            {card.change && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                card.change.includes('+') ? 'bg-green-100 text-green-800' :
                card.change.includes('-') ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {card.change}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
        </motion.div>
      ))}
    </>
  );
};

export default AnalyticsCards;