import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const LeaveHistory = ({ leaves = [] }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  if (!leaves || !Array.isArray(leaves) || leaves.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No leave applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave) => (
        <div key={leave._id} className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getStatusIcon(leave.status)}
              <div>
                <h3 className="font-semibold">
                  {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {format(new Date(leave.startDate), 'MMM dd, yyyy')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-500 mt-2">{leave.reason}</p>
                {leave.halfDay && (
                  <span className="inline-block mt-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    Half Day
                  </span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(leave.status)}`}>
              {leave.status}
            </span>
          </div>
          
          {leave.approvedBy && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                Approved by: {leave.approvedBy.name} on {format(new Date(leave.approvedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LeaveHistory;