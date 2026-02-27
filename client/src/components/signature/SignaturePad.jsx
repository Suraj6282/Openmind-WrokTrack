import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, RefreshCw, Check } from 'lucide-react';

const SignaturePad = ({ onSave, width = 500, height = 200 }) => {
  const sigCanvas = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clear = () => {
    sigCanvas.current.clear();
  };

  const save = () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Please provide a signature first');
      return;
    }
    
    const signatureData = sigCanvas.current.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas bg-white dark:bg-gray-800 cursor-crosshair'
          }}
          onBegin={() => setIsDrawing(true)}
          onEnd={() => setIsDrawing(false)}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={clear}
          className="flex-1 btn-secondary flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Clear</span>
        </button>
        
        <button
          onClick={save}
          className="flex-1 btn-primary flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Signature</span>
        </button>
      </div>
      
      {!isDrawing && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Draw your signature above
        </p>
      )}
    </div>
  );
};

export default SignaturePad;