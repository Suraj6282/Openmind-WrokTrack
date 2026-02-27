import React from 'react';
import { CheckCircle, XCircle, Fingerprint } from 'lucide-react';
import { format } from 'date-fns';

const SignatureVerification = ({ signature, onVerify }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Fingerprint className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold">Digital Signature Verification</h3>
        </div>
        {signature?.verified ? (
          <span className="flex items-center space-x-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 text-yellow-600 text-sm">
            <XCircle className="w-4 h-4" />
            <span>Pending</span>
          </span>
        )}
      </div>

      {signature && (
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <img 
              src={signature.image} 
              alt="Signature" 
              className="max-h-20 mx-auto border border-gray-200 dark:border-gray-700 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Signed By</p>
              <p className="font-medium">{signature.user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Date & Time</p>
              <p className="font-medium">
                {format(new Date(signature.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Device ID</p>
              <p className="font-medium text-xs truncate">{signature.deviceId}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">IP Address</p>
              <p className="font-medium text-xs">{signature.ipAddress}</p>
            </div>
          </div>

          {!signature.verified && onVerify && (
            <button
              onClick={() => onVerify(signature._id)}
              className="btn-primary w-full mt-3"
            >
              Verify Signature
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SignatureVerification;