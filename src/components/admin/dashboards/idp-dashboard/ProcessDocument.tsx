'use client';
import { useState, useRef } from 'react';
import { MdCloudUpload, MdCheckCircle, MdError, MdContentCopy, MdArrowForward } from 'react-icons/md';

/**
 * Component for processing a single document through IDP
 */
const ProcessDocument = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  // Handle file selection via the file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Validate the file type and size
  const validateAndSetFile = (file: File) => {
    // Reset previous states
    setError(null);
    setProcessComplete(false);
    setProcessingResult(null);
    
    // Check file type (PDF, TIFF, JPEG, PNG)
    const validTypes = ['application/pdf', 'image/tiff', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, TIFF, JPEG, or PNG file.');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum file size is 10MB.');
      return;
    }
    
    setFile(file);
  };

  // Handle the document processing
  const handleProcessDocument = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock result (in a real app, this would come from an API call)
      const mockResult = {
        documentId: 'DOC-' + Math.random().toString(36).substr(2, 9),
        accuracy: 97.8,
        fields: {
          invoiceNumber: { value: 'INV-2023-05678', confidence: 0.98 },
          date: { value: '2023-07-15', confidence: 0.96 },
          total: { value: '$1,245.78', confidence: 0.94 },
          vendor: { value: 'Acme Supplies Ltd.', confidence: 0.99 }
        },
        processingTime: '2.3 seconds'
      };
      
      setProcessingResult(mockResult);
      setProcessComplete(true);
    } catch (err) {
      setError('An error occurred during processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the process to upload a new document
  const handleReset = () => {
    setFile(null);
    setProcessComplete(false);
    setProcessingResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4">Process Document</h2>
      
      {!file && !processComplete && (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-700'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <MdCloudUpload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop your document here, or
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </button>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.tiff,.tif,.jpeg,.jpg,.png"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Supported formats: PDF, TIFF, JPEG, PNG (max 10MB)
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm flex items-start">
          <MdError className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {file && !processComplete && !isProcessing && (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-navy-900 p-3 rounded-md">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                {getFileIcon(file.type)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
              onClick={handleReset}
            >
              Remove
            </button>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-navy-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleReset}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              onClick={handleProcessDocument}
            >
              Process Document
              <MdArrowForward className="ml-2" />
            </button>
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4 p-6 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Processing your document...</p>
          <div className="w-full max-w-md mt-4 bg-gray-200 dark:bg-navy-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {processComplete && processingResult && (
        <div className="mt-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center mb-4">
            <MdCheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-400 text-sm">Document processed successfully</span>
          </div>
          
          <div className="bg-gray-50 dark:bg-navy-900 rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Processing Results</h3>
              <div className="flex items-center">
                <button
                  title="Copy results"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <MdContentCopy className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Document ID:</span>
                <span className="font-mono">{processingResult.documentId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>
                <span>{processingResult.accuracy}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Processing Time:</span>
                <span>{processingResult.processingTime}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-navy-700">
                <h4 className="text-sm font-medium mb-2">Extracted Fields:</h4>
                <div className="space-y-2">
                  {Object.entries(processingResult.fields).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white dark:bg-navy-800 p-2 rounded border border-gray-200 dark:border-navy-700">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{formatKey(key)}:</span>
                        <span className="text-sm bg-gray-100 dark:bg-navy-700 px-2 py-0.5 rounded">
                          {value.confidence * 100}% confidence
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-mono">{value.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-navy-700 border border-gray-300 dark:border-navy-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-navy-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleReset}
            >
              Process Another Document
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getFileIcon = (fileType: string) => {
  const iconClass = "h-6 w-6 text-blue-500";
  
  if (fileType === 'application/pdf') {
    return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 24C7.4 24 7 23.6 7 23V18C7 17.4 7.4 17 8 17C8.6 17 9 17.4 9 18V22H20V10H18C16.3 10 15 8.7 15 7V5H9V9C9 9.6 8.6 10 8 10C7.4 10 7 9.6 7 9V4C7 3.4 7.4 3 8 3H16.6C16.9 3 17.1 3.1 17.4 3.4L21.6 7.6C21.9 7.9 22 8.1 22 8.4V23C22 23.6 21.6 24 21 24H8ZM19.1 8L17 5.9V7C17 7.6 17.4 8 18 8H19.1ZM3 15V12C3 11.4 3.4 11 4 11H12C12.6 11 13 11.4 13 12V15C13 15.6 12.6 16 12 16H4C3.4 16 3 15.6 3 15ZM5 14H11V13H5V14ZM4 20C3.4 20 3 19.6 3 19V18C3 17.4 3.4 17 4 17H12C12.6 17 13 17.4 13 18V19C13 19.6 12.6 20 12 20H4ZM5 18V19H11V18H5Z" />
    </svg>;
  }
  
  if (fileType.startsWith('image/')) {
    return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 21Q4.175 21 3.588 20.413Q3 19.825 3 19V5Q3 4.175 3.588 3.587Q4.175 3 5 3H19Q19.825 3 20.413 3.587Q21 4.175 21 5V19Q21 19.825 20.413 20.413Q19.825 21 19 21ZM5 19H19Q19 19 19 19Q19 19 19 19V5Q19 5 19 5Q19 5 19 5H5Q5 5 5 5Q5 5 5 5V19Q5 19 5 19Q5 19 5 19ZM5 19Q5 19 5 19Q5 19 5 19V5Q5 5 5 5Q5 5 5 5H19Q19 5 19 5Q19 5 19 5V19Q19 19 19 19Q19 19 19 19ZM7 17H17L14 13L11 17L9 14ZM8.5 11Q9.125 11 9.562 10.562Q10 10.125 10 9.5Q10 8.875 9.562 8.438Q9.125 8 8.5 8Q7.875 8 7.438 8.438Q7 8.875 7 9.5Q7 10.125 7.438 10.562Q7.875 11 8.5 11Z" />
    </svg>;
  }
  
  return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
  </svg>;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

export default ProcessDocument; 