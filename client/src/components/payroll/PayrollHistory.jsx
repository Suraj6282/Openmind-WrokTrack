import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  History, 
  Download, 
  Eye, 
  Lock, 
  Unlock,
  Filter,
  Search,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { getPayrollHistory, lockPayroll, generateSalarySlip } from '../../services/payroll';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const PayrollHistory = () => {
  const { isAdmin } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchPayrolls();
  }, [selectedYear]);

  useEffect(() => {
    filterPayrolls();
  }, [searchTerm, statusFilter, payrolls]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const data = await getPayrollHistory({ year: selectedYear });
      setPayrolls(data);
      setFilteredPayrolls(data);
    } catch (error) {
      toast.error('Failed to load payroll history');
    } finally {
      setLoading(false);
    }
  };

  const filterPayrolls = () => {
    let filtered = [...payrolls];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    setFilteredPayrolls(filtered);
  };

  const handleLockPayroll = async (payrollId) => {
    try {
      await lockPayroll(payrollId);
      toast.success('Payroll locked successfully');
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to lock payroll');
    }
  };

  const handleGenerateSlip = async (payrollId) => {
    try {
      await generateSalarySlip(payrollId);
      toast.success('Salary slip generated');
    } catch (error) {
      toast.error('Failed to generate salary slip');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      calculated: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      approved: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      locked: { color: 'bg-green-100 text-green-800', icon: Lock },
      paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <History className="w-5 h-5 text-primary-600" />
            <span>Payroll History</span>
          </h3>

          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field w-auto"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={fetchPayrolls}
              icon={Filter}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="calculated">Calculated</option>
            <option value="approved">Approved</option>
            <option value="locked">Locked</option>
            <option value="paid">Paid</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            Showing {filteredPayrolls.length} of {payrolls.length} records
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredPayrolls.map((payroll) => (
          <motion.div
            key={payroll._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {payroll.employee?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {payroll.employee?.employeeId} • {payroll.employee?.department?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getMonthName(payroll.month)} {payroll.year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Net Payable</p>
                    <p className="text-xl font-bold text-primary-600">
                      ₹{payroll.netPayable?.toLocaleString()}
                    </p>
                  </div>
                  
                  {getStatusBadge(payroll.status)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Working Days</p>
                  <p className="font-medium">{payroll.workingDays}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="font-medium">{payroll.presentDays}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Leaves</p>
                  <p className="font-medium">{payroll.leaves?.total || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overtime</p>
                  <p className="font-medium">{payroll.overtime?.hours || 0}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deductions</p>
                  <p className="font-medium">₹{payroll.deductions?.total || 0}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedRow(expandedRow === payroll._id ? null : payroll._id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedRow === payroll._id ? 'Show Less' : 'View Details'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateSlip(payroll._id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Slip
                    </Button>

                    {isAdmin && payroll.status !== 'locked' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleLockPayroll(payroll._id)}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Lock
                      </Button>
                    )}

                    {payroll.salarySlip?.generated && (
                      <Button
                        variant="primary"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {expandedRow === payroll._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <h5 className="font-medium mb-2">Earnings</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Basic:</span>
                            <span>₹{payroll.basicSalary}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">HRA:</span>
                            <span>₹{payroll.allowances?.hra || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Conveyance:</span>
                            <span>₹{payroll.allowances?.conveyance || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Overtime:</span>
                            <span>₹{payroll.overtime?.amount || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Deductions</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Late Penalty:</span>
                            <span>₹{payroll.deductions?.latePenalty || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Half Day:</span>
                            <span>₹{payroll.deductions?.halfDayPenalty || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Unpaid Leaves:</span>
                            <span>₹{payroll.leaves?.unpaid * payroll.perDaySalary || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Leave Details</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Paid:</span>
                            <span>{payroll.leaves?.paid || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Unpaid:</span>
                            <span>{payroll.leaves?.unpaid || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sick:</span>
                            <span>{payroll.leaves?.sick || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Audit Trail</h5>
                        <div className="space-y-1 text-sm">
                          {payroll.auditTrail?.slice(-3).map((log, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="text-gray-500">{log.action}:</span>
                              <br />
                              <span>{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {payroll.salarySlip?.signatures && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="font-medium mb-2">Digital Signatures</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Employee Signature:</p>
                            <p className="text-sm">
                              {payroll.salarySlip.signatures.employee ? '✓ Signed' : '✗ Pending'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Admin Signature:</p>
                            <p className="text-sm">
                              {payroll.salarySlip.signatures.admin ? '✓ Signed' : '✗ Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}

        {filteredPayrolls.length === 0 && (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Payroll Records Found
            </h3>
            <p className="text-gray-500">
              No payroll data available for the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get month name
function getMonthName(monthNum) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthNum - 1];
}

export default PayrollHistory;