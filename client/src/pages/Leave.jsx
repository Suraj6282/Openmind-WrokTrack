import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab } from '../components/common/Tabs';
import LeaveApplication from '../components/leave/LeaveApplication';
import LeaveBalance from '../components/leave/LeaveBalance';
import LeaveHistory from '../components/leave/LeaveHistory';
import { getLeaveBalance, getLeaveHistory } from '../services/leave';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Leave = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [balances, setBalances] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const [balanceData, historyData] = await Promise.all([
        getLeaveBalance().catch(err => ({ data: null })),
        getLeaveHistory().catch(err => ({ data: [] }))
      ]);
      setBalances(balanceData?.data || balanceData);
      setLeaves(historyData?.data || historyData || []);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      // Set default values instead of showing error
      setBalances(null);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'apply', label: 'Apply Leave' },
    { id: 'history', label: 'History' },
    ...(isAdmin ? [{ id: 'approvals', label: 'Pending Approvals' }] : [])
  ];

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
      <h1 className="text-2xl font-bold">Leave Management</h1>

      {balances && <LeaveBalance balances={balances} />}

      <div className="card">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
          <Tab active={activeTab === 0}>
            <LeaveApplication onSuccess={fetchLeaveData} />
          </Tab>
          <Tab active={activeTab === 1}>
            <LeaveHistory leaves={leaves} />
          </Tab>
          {isAdmin && (
            <Tab active={activeTab === 2}>
              {/* Pending approvals component */}
              <div className="text-center py-8">
                <p className="text-gray-500">Pending approvals will appear here</p>
              </div>
            </Tab>
          )}
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Leave;