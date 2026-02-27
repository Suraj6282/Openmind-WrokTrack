import React from 'react';
import { Umbrella, Coffee, Heart } from 'lucide-react';

const LeaveBalance = ({ balances }) => {
  const leaveTypes = [
    { key: 'paid', label: 'Paid Leave', icon: Umbrella, color: 'blue' },
    { key: 'sick', label: 'Sick Leave', icon: Heart, color: 'red' },
    { key: 'unpaid', label: 'Unpaid Leave', icon: Coffee, color: 'gray' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {leaveTypes.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {balances?.[key]?.used || 0} used
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            {balances?.[key]?.remaining || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xs text-gray-400 mt-2">
            Total: {balances?.[key]?.total || 0} days
          </p>
        </div>
      ))}
    </div>
  );
};

export default LeaveBalance;