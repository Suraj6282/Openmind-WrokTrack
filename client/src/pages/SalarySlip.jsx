import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Download, Eye, FileText, Lock } from 'lucide-react';
import { getSalarySlips, downloadSalarySlip } from '../services/payroll';
import SignaturePad from '../components/signature/SignaturePad';
import SignatureVerification from '../components/signature/SignatureVerification';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';

const SalarySlip = () => {
  const [slips, setSlips] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      const data = await getSalarySlips();
      setSlips(data?.data || data || []);
    } catch (error) {
      console.error('Failed to load salary slips:', error);
      setSlips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
    if (!slip.signed) {
      setShowSignaturePad(true);
    }
  };

  const handleSignatureSave = async (signatureData) => {
    try {
      // Save signature and generate slip
      setShowSignaturePad(false);
      toast.success('Salary slip signed successfully');
      fetchSlips();
    } catch (error) {
      toast.error('Failed to sign salary slip');
    }
  };

  const handleDownload = async (slipId) => {
    try {
      await downloadSalarySlip(slipId);
    } catch (error) {
      toast.error('Failed to download salary slip');
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
      <h1 className="text-2xl font-bold">Salary Slips</h1>

      {!Array.isArray(slips) || slips.length === 0 ? (
        <div className="text-center py-12 card">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Salary Slips Found
          </h3>
          <p className="text-gray-500">
            Salary slips will appear here once generated
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {slips.map((slip) => (
          <Card key={slip._id}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {slip.month} {slip.year}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Net Payable: ₹{slip.netPayable?.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {slip.signed ? (
                      <span className="text-xs text-green-600 flex items-center">
                        <Lock className="w-3 h-3 mr-1" />
                        Signed & Locked
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600">
                        Pending Signature
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewSlip(slip)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(slip._id)}
                  disabled={!slip.signed}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {slip.signed && slip.signature && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <SignatureVerification signature={slip.signature} />
              </div>
            )}
          </Card>
        ))}
        </div>
      )}

      {showSignaturePad && selectedSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Sign Salary Slip</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please sign below to digitally sign your salary slip for {selectedSlip.month} {selectedSlip.year}
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

export default SalarySlip;