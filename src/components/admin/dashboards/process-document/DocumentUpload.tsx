import Card from '@/components/card';
import { useState, useRef, ChangeEvent } from 'react';
import { MdCloudUpload } from 'react-icons/md';

interface DocumentUploadProps {
  onFileSelect?: (file: File) => void;
}

const DocumentUpload = ({ onFileSelect }: DocumentUploadProps = {}) => {
  const [processingMethod, setProcessingMethod] = useState<'predefined' | 'oneoff'>('predefined');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // Check if the file type is supported
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload a PDF or image file.');
      return;
    }
    
    // Pass the file to the parent component
    if (onFileSelect) {
      onFileSelect(file);
    }
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <Card extra={'flex flex-col p-[28px] w-full h-full bg-white dark:bg-navy-900 shadow-xl'}>
      <h4 className="text-2xl font-bold text-navy-700 dark:text-white mb-2">
        Upload Document
      </h4>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">
        Upload a document to process and extract data
      </p>
      
      <div className="mb-6">
        <p className="font-medium text-navy-700 dark:text-white mb-3">
          Choose processing method:
        </p>
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="radio"
                name="processingMethod"
                checked={processingMethod === 'predefined'}
                onChange={() => setProcessingMethod('predefined')}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border ${processingMethod === 'predefined' ? 'border-brand-500' : 'border-gray-300 dark:border-gray-500'}`}></div>
              {processingMethod === 'predefined' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-navy-700 dark:text-white">
              Use predefined workflow
            </span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="radio"
                name="processingMethod"
                checked={processingMethod === 'oneoff'}
                onChange={() => setProcessingMethod('oneoff')}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border ${processingMethod === 'oneoff' ? 'border-brand-500' : 'border-gray-300 dark:border-gray-500'}`}></div>
              {processingMethod === 'oneoff' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-navy-700 dark:text-white">
              One-off processing
            </span>
          </label>
        </div>
      </div>
      
      {processingMethod === 'predefined' && (
        <div className="mb-6">
          <p className="font-medium text-navy-700 dark:text-white mb-3">
            Select workflow:
          </p>
          <select 
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm outline-none text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-white appearance-none relative"
            defaultValue=""
          >
            <option value="" disabled>Select a workflow</option>
            <option value="workflow1">Invoice Processing</option>
            <option value="workflow2">Contract Analysis</option>
            <option value="workflow3">Form Extraction</option>
          </select>
        </div>
      )}
      
      <div
        className={`flex flex-col items-center justify-center border border-dashed ${
          dragActive ? 'border-brand-500 bg-brand-50 dark:bg-navy-800' : 'border-gray-200 bg-gray-50 dark:border-navy-700 dark:bg-navy-800'
        } rounded-xl p-6 cursor-pointer transition-all`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          style={{ display: 'none' }}
          onChange={handleFileInput}
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/tiff"
        />
        <div className="flex items-center justify-center rounded-full bg-brand-500 p-4 text-2xl text-white shadow-lg mb-4">
          <MdCloudUpload size={28} />
        </div>
        <p className="text-center font-medium text-navy-700 dark:text-white mb-1">
          Drag and drop a file here, or click to select a file
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Supported formats: application/pdf, image/jpeg, image/jpg, image/png, image/tiff
        </p>
      </div>
    </Card>
  );
};

export default DocumentUpload; 