import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Download, Lock, Unlock, Eye } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import SignaturePad from '../components/signature/SignaturePad';
import { getPayrollHistory, generateSalarySlip, lockPayroll } from '../services/payroll';
import { saveSignature, verifySignature } from '../services/signature';
import { generatePDF } from '../utils/pdfGenerator';

const Payroll = () => {
  const { user, isAdmin } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const data = await getPayrollHistory();
      setPayrolls(data?.data || data || []);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
      // Set empty array instead of showing error
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlip = async (payroll) => {
    try {
      const slip = await generateSalarySlip(payroll._id);
      setSelectedPayroll(slip);
      
      if (!slip.isSigned) {
        setShowSignaturePad(true);
      } else {
        downloadSlip(slip);
      }
    } catch (error) {
      toast.error('Failed to generate salary slip');
    }
  };

  const handleSignatureSave = async (signatureData) => {
    try {
      const deviceId = await getDeviceId();
      const signature = await saveSignature({
        employeeId: user._id,
        payrollId: selectedPayroll._id,
        signature: signatureData,
        deviceId,
        ipAddress: await getIPAddress()
      });

      // Add admin signature and lock payroll
      const lockedPayroll = await lockPayroll(selectedPayroll._id, signature._id);
      
      setShowSignaturePad(false);
      setSelectedPayroll(lockedPayroll);
      
      toast.success('Salary slip signed and locked successfully');
      downloadSlip(lockedPayroll);
      
      // Refresh payroll list
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to save signature');
    }
  };

  const downloadSlip = (slip) => {
    generatePDF(slip);
  };

  const handleLockPayroll = async (payrollId) => {
    if (!isAdmin) return;
    
    try {
      const locked = await lockPayroll(payrollId);
      toast.success('Payroll locked successfully');
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to lock payroll');
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
      <h1 className="text-2xl font-bold">Payroll</h1>

      <div className="grid gap-4">
        {Array.isArray(payrolls) && payrolls.length > 0 ? payrolls.map((payroll) => (
          <motion.div
            key={payroll._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h3 className="font-semibold text-lg">
                  {payroll.month} {payroll.year}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Net Payable: ₹{payroll.netPayable.toLocaleString()}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payroll.status === 'locked'
                      ? 'bg-green-100 text-green-800'
                      : payroll.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {payroll.status}
                  </span>
                  {payroll.isLocked && (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleGenerateSlip(payroll)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Slip</span>
                </button>

                {isAdmin && !payroll.isLocked && (
                  <button
                    onClick={() => handleLockPayroll(payroll._id)}
                    className="btn-secondary"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Working Days</p>
                <p className="font-semibold">{payroll.workingDays}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Leaves</p>
                <p className="font-semibold">{payroll.leaves}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Overtime</p>
                <p className="font-semibold">{payroll.overtime} hrs</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Deductions</p>
                <p className="font-semibold">₹{payroll.deductions}</p>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No payroll records found</p>
          </div>
        )}
      </div>

      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Digital Signature Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please sign below to digitally sign your salary slip
            </p>
            
            <SignaturePad onSave={handleSignatureSave} />
            
            <button
              onClick={() => setShowSignaturePad(false)}
              className="mt-4 btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Payroll;