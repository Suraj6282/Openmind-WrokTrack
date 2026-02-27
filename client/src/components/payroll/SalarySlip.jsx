import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2,
  CheckCircle,
  XCircle,
  Fingerprint,
  User,
  Calendar,
  Clock,
  DollarSign,
  Building,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import SignaturePad from '../signature/SignaturePad';
import { generateSalarySlipPDF } from '../../utils/pdfGenerator';
import { saveSignature, verifySignature } from '../../services/signature';
import { getSalarySlipById, lockPayroll } from '../../services/payroll';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import toast from 'react-hot-toast';

const SalarySlip = ({ slipId, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState('employee');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    fetchSalarySlip();
  }, [slipId]);

  const fetchSalarySlip = async () => {
    try {
      const data = await getSalarySlipById(slipId);
      setSlip(data);
      
      // Check verification status
      if (data.signatures?.employee) {
        const verified = await verifySignature(data.signatures.employee);
        setVerificationStatus(verified);
      }
    } catch (error) {
      toast.error('Failed to load salary slip');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = async (signatureData) => {
    try {
      const deviceId = await getDeviceId();
      const ipAddress = await getIPAddress();
      
      const signature = await saveSignature({
        employeeId: slip.employee._id,
        payrollId: slip._id,
        signature: signatureData,
        type: signatureType,
        deviceId,
        ipAddress
      });

      // Update slip with signature
      if (signatureType === 'employee') {
        setSlip(prev => ({
          ...prev,
          signatures: { ...prev.signatures, employee: signature }
        }));
      } else {
        setSlip(prev => ({
          ...prev,
          signatures: { ...prev.signatures, admin: signature }
        }));
      }

      setShowSignaturePad(false);
      toast.success(`${signatureType} signature added successfully`);

      // If both signatures present, offer to lock
      if (slip.signatures?.employee && signatureType === 'admin') {
        handleLockPayroll();
      }
    } catch (error) {
      toast.error('Failed to save signature');
    }
  };

  const handleLockPayroll = async () => {
    try {
      await lockPayroll(slip._id);
      setSlip(prev => ({ ...prev, isLocked: true }));
      toast.success('Payroll locked successfully');
    } catch (error) {
      toast.error('Failed to lock payroll');
    }
  };

  const handleDownload = () => {
    generateSalarySlipPDF(slip);
    toast.success('Salary slip downloaded');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Salary Slip - ${slip.employee.name} - ${slip.month} ${slip.year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { color: #2563eb; font-size: 24px; font-weight: bold; }
            .slip-title { font-size: 20px; margin: 10px 0; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #2563eb; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
            .watermark { 
              position: fixed; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px; 
              opacity: 0.1; 
              color: #2563eb;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          ${document.getElementById('salary-slip-content').innerHTML}
        </body>
      </html>
    `);
    printWindow.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Salary Slip - ${slip.employee.name}`,
          text: `Salary slip for ${slip.month} ${slip.year}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  const calculateEarnings = () => {
    const earnings = [
      { label: 'Basic Salary', amount: slip.basicSalary },
      { label: 'House Rent Allowance', amount: slip.allowances?.hra || 0 },
      { label: 'Conveyance Allowance', amount: slip.allowances?.conveyance || 0 },
      { label: 'Medical Allowance', amount: slip.allowances?.medical || 0 },
      { label: 'Special Allowance', amount: slip.allowances?.special || 0 },
      { label: 'Overtime', amount: slip.overtime?.amount || 0 }
    ];
    return earnings;
  };

  const calculateDeductions = () => {
    const deductions = [
      { label: 'Late Penalty', amount: slip.deductions?.latePenalty || 0 },
      { label: 'Half Day Penalty', amount: slip.deductions?.halfDayPenalty || 0 },
      { label: 'Unpaid Leave', amount: slip.leaves?.unpaid * slip.perDaySalary || 0 },
      { label: 'Other Deductions', amount: slip.deductions?.otherDeductions || 0 }
    ];
    return deductions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Salary Slip Not Found
        </h3>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  const earnings = calculateEarnings();
  const deductions = calculateDeductions();
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPayable = totalEarnings - totalDeductions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Action Bar */}
      <div className="flex justify-end space-x-3 mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint} icon={Printer}>
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} icon={Share2}>
          Share
        </Button>
        <Button variant="primary" size="sm" onClick={handleDownload} icon={Download}>
          Download PDF
        </Button>
        {isAdmin && !slip.isLocked && (
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              setSignatureType('admin');
              setShowSignaturePad(true);
            }}
            icon={Fingerprint}
          >
            Sign as Admin
          </Button>
        )}
        {!slip.signatures?.employee && user._id === slip.employee._id && (
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              setSignatureType('employee');
              setShowSignaturePad(true);
            }}
            icon={Fingerprint}
          >
            Sign as Employee
          </Button>
        )}
      </div>

      {/* Salary Slip Content */}
      <Card className="relative overflow-hidden">
        {/* Watermark for signed slips */}
        {slip.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl font-bold text-primary-200 dark:text-primary-800 opacity-30 transform -rotate-45">
              DIGITALLY SIGNED
            </div>
          </div>
        )}

        <div id="salary-slip-content" ref={printRef} className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">OpenMind WorkTrack</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Salary Slip</p>
            <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-500">
              <span>For the month of {slip.month} {slip.year}</span>
              <span>•</span>
              <span>Generated on {format(new Date(slip.generatedAt || new Date()), 'dd MMM yyyy')}</span>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{slip.company?.name || 'OpenMind Technologies'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{slip.company?.email || 'hr@openmind.com'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{slip.company?.phone || '+91 1234567890'}</span>
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Employee Details</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{slip.employee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee ID:</span>
                  <span className="font-medium">{slip.employee?.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium">{slip.employee?.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Designation:</span>
                  <span className="font-medium">{slip.employee?.position || 'Employee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PAN:</span>
                  <span className="font-medium">{slip.employee?.pan || 'XXXXX1234X'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Attendance Summary</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Working Days:</span>
                  <span className="font-medium">{slip.workingDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Present Days:</span>
                  <span className="font-medium">{slip.presentDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Leaves:</span>
                  <span className="font-medium">{slip.leaves?.paid || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unpaid Leaves:</span>
                  <span className="font-medium">{slip.leaves?.unpaid || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overtime Hours:</span>
                  <span className="font-medium">{slip.overtime?.hours || 0}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center space-x-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>Earnings</span>
              </h3>
              <div className="space-y-2">
                {earnings.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}:</span>
                    <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total Earnings:</span>
                  <span className="text-green-600">₹{totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Deductions</span>
              </h3>
              <div className="space-y-2">
                {deductions.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}:</span>
                    <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">₹{totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Payable */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Payable</p>
                <p className="text-3xl font-bold text-primary-600">₹{netPayable.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Words</p>
                <p className="text-sm font-medium">{numberToWords(netPayable)} Rupees Only</p>
              </div>
            </div>
          </div>

          {/* Digital Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Employee Signature</h3>
              {slip.signatures?.employee ? (
                <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                  <img 
                    src={slip.signatures.employee.image} 
                    alt="Employee Signature" 
                    className="max-h-16 mx-auto"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">
                      {format(new Date(slip.signatures.employee.timestamp), 'dd MMM yyyy HH:mm')}
                    </span>
                    {verificationStatus ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-lg text-center">
                  <Fingerprint className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Not signed yet</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Admin Signature</h3>
              {slip.signatures?.admin ? (
                <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                  <img 
                    src={slip.signatures.admin.image} 
                    alt="Admin Signature" 
                    className="max-h-16 mx-auto"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">
                      {format(new Date(slip.signatures.admin.timestamp), 'dd MMM yyyy HH:mm')}
                    </span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-lg text-center">
                  <Fingerprint className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Not signed yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span>This is a computer generated salary slip</span>
              <span>Slip ID: {slip._id}</span>
            </div>
            {slip.isLocked && (
              <div className="text-center mt-2 text-primary-600">
                This document is digitally signed and locked. No modifications allowed.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">
              {signatureType === 'employee' ? 'Employee' : 'Admin'} Signature
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please sign below to digitally sign this salary slip
            </p>
            
            <SignaturePad onSave={handleSignatureSave} />
            
            <Button
              variant="secondary"
              onClick={() => setShowSignaturePad(false)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };
  
  return numToWords(num);
}

// Helper functions
async function getDeviceId() {
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;
  
  const deviceId = btoa(
    JSON.stringify({
      userAgent: navigatorInfo.userAgent,
      language: navigatorInfo.language,
      platform: navigatorInfo.platform,
      screenWidth: screenInfo.width,
      screenHeight: screenInfo.height
    })
  );
  
  return deviceId;
}

async function getIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return '0.0.0.0';
  }
}

export default SalarySlip;