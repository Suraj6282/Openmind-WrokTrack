import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Calculator, 
  Download, 
  Lock, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { calculatePayroll, getPayrollHistory } from '../../services/payroll';
import { getBusinessRules } from '../../services/settings';
import toast from 'react-hot-toast';

const SalaryCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [rules, setRules] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollData, setPayrollData] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchRules();
    fetchPayrollData();
  }, [selectedMonth]);

  const fetchRules = async () => {
    try {
      const data = await getBusinessRules();
      setRules(data);
    } catch (error) {
      toast.error('Failed to load business rules');
    }
  };

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const data = await getPayrollHistory({ month: parseInt(month), year: parseInt(year) });
      setPayrollData(data);
    } catch (error) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const result = await calculatePayroll(parseInt(month), parseInt(year));
      setResults(result);
      
      if (result.errors?.length > 0) {
        toast.error(`Calculated with ${result.errors.length} errors`);
      } else {
        toast.success('Payroll calculated successfully');
      }
      
      fetchPayrollData();
    } catch (error) {
      toast.error('Failed to calculate payroll');
    } finally {
      setCalculating(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
  };

  const calculateTotals = () => {
    if (!payrollData) return { totalSalary: 0, totalEmployees: 0, totalOvertime: 0 };
    
    return payrollData.reduce((acc, payroll) => ({
      totalSalary: acc.totalSalary + payroll.netPayable,
      totalEmployees: acc.totalEmployees + 1,
      totalOvertime: acc.totalOvertime + (payroll.overtime?.hours || 0)
    }), { totalSalary: 0, totalEmployees: 0, totalOvertime: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              <span>Salary Calculator</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Calculate monthly salaries based on attendance and business rules
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field w-auto"
              max={format(new Date(), 'yyyy-MM')}
            />
            
            <Button
              onClick={handleCalculate}
              loading={calculating}
              icon={RefreshCw}
            >
              Calculate
            </Button>
          </div>
        </div>

        {rules && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Overtime Rate</p>
              <p className="text-2xl font-bold">{rules.payroll.overtimeRate}x</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Late Penalty</p>
              <p className="text-2xl font-bold">₹{rules.payroll.latePenalty}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Half Day Penalty</p>
              <p className="text-2xl font-bold">₹{rules.payroll.halfDayPenalty}</p>
            </div>
          </div>
        )}
      </Card>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h4 className="font-semibold mb-4">Calculation Results</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-600">Successfully Processed</p>
                <p className="text-2xl font-bold text-green-700">
                  {results.results?.length || 0}
                </p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-600">Errors</p>
                <p className="text-2xl font-bold text-red-700">
                  {results.errors?.length || 0}
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Payroll</p>
                <p className="text-2xl font-bold text-blue-700">
                  ₹{totals.totalSalary.toLocaleString()}
                </p>
              </div>
            </div>

            {results.errors?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-red-600 mb-2">Errors:</h5>
                <div className="space-y-2">
                  {results.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <XCircle className="w-4 h-4 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.results?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-green-600 mb-2">Processed:</h5>
                <div className="space-y-2">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <CheckCircle className="w-4 h-4 mt-0.5" />
                      <span>{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {payrollData && payrollData.length > 0 && (
        <Card>
          <h4 className="font-semibold mb-4">Monthly Summary</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Working Days</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Present</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Overtime</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net Payable</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payroll) => (
                  <tr key={payroll._id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{payroll.employee?.name}</p>
                        <p className="text-xs text-gray-500">{payroll.employee?.employeeId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{payroll.workingDays}</td>
                    <td className="py-3 px-4">{payroll.presentDays}</td>
                    <td className="py-3 px-4">{payroll.overtime?.hours || 0}h</td>
                    <td className="py-3 px-4 font-medium">₹{payroll.netPayable?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        payroll.status === 'locked' ? 'bg-green-100 text-green-800' :
                        payroll.status === 'calculated' ? 'bg-blue-100 text-blue-800' :
                        payroll.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Payroll Amount</p>
                <p className="text-2xl font-bold text-primary-600">
                  ₹{totals.totalSalary.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{totals.totalEmployees}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Overtime</p>
                <p className="text-2xl font-bold">{totals.totalOvertime}h</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!loading && payrollData?.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Payroll Data
          </h3>
          <p className="text-gray-500">
            Click Calculate to generate payroll for the selected month
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;