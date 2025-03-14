'use client';

import { useState, useRef, useEffect } from 'react';
import { MdCloudUpload, MdHideImage, MdCheck, MdInfo, MdWarning, MdClose } from 'react-icons/md';
import Card from '@/components/card';

// Define interfaces for our data structures
interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  duration: number; // in days
}

interface DocumentMetadata {
  documentType: string;
  documentSubType?: string;
  dataSensitivity: string;
  retentionPolicyId: string;
  customFields: Array<{id: string, name: string, value: string}>;
}

interface TfnDetectionResult {
  detected: boolean;
  count?: number;
  error?: string;
}

interface ProcessingResults {
  tfnDetection?: TfnDetectionResult;
  redactedImage?: string | null;
}

// Sensitivity levels for documents
const sensitivityLevels = [
  { id: 'public', name: 'Public', description: 'Information that can be freely shared with the public' },
  { id: 'internal', name: 'Internal', description: 'Information for internal use only' },
  { id: 'confidential', name: 'Confidential', description: 'Sensitive information with restricted access' },
  { id: 'restricted', name: 'Restricted', description: 'Highly restricted information with strictly limited access' }
];

const DocumentStoragePage = () => {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanForTFN, setScanForTFN] = useState(true);
  const [processingResults, setProcessingResults] = useState<ProcessingResults>({});
  
  // Document metadata state
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata>({
    documentType: '',
    documentSubType: '',
    dataSensitivity: 'internal', // default
    retentionPolicyId: '',
    customFields: []
  });
  
  // Retention policies
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  
  // Redaction state
  const [saveRedactedVersion, setSaveRedactedVersion] = useState(true);
  const [redactedItems, setRedactedItems] = useState<Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
    value?: string;
  }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file drop and selection
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
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setSelectedFile(file);
    
    // Generate preview
    const fileType = file.type;
    setIsImage(fileType.startsWith('image/'));
    setIsPdf(fileType === 'application/pdf');
    
    if (fileType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'application/pdf') {
      // For PDFs we'll just show a placeholder
      setPreview('/pdf-placeholder.png');
    }
    
    // Reset processing results when a new file is selected
    setProcessingResults({});
    setRedactedItems([]);
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle processing the document
  const processDocument = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      let results: ProcessingResults = {};
      
      // Step 1: Scan for TFN if enabled
      if (scanForTFN) {
        // If it's an image, we'll need to extract text first
        if (isImage) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const textResponse = await fetch('/api/docs-2-analyse/extract-text', {
            method: 'POST',
            body: formData
          });
          
          if (textResponse.ok) {
            const textData = await textResponse.json();
            
            if (textData.success && textData.text) {
              // Now scan the extracted text for TFNs
              const tfnResponse = await fetch('/api/docs-2-analyse/scan-for-tfn', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  text: textData.text 
                })
              });
              
              if (tfnResponse.ok) {
                const tfnResult = await tfnResponse.json();
                results.tfnDetection = {
                  detected: tfnResult.tfnIdentified,
                  count: tfnResult.tfnCount || 0
                };
                
                // If TFNs are detected, add them to the redacted items
                if (tfnResult.tfnIdentified) {
                  setRedactedItems([{
                    id: 'tfn-1',
                    type: 'field',
                    name: 'Tax File Number',
                    value: 'TFN' // This is a placeholder, in a real implementation we'd use the actual value
                  }]);
                }
              }
            }
          }
        } else if (isPdf) {
          // For PDFs, we'd need a more complex text extraction process
          // This is a simplified mock for demonstration
          results.tfnDetection = {
            detected: Math.random() > 0.5, // Randomly detect TFNs for demo
            count: Math.floor(Math.random() * 3)
          };
          
          if (results.tfnDetection.detected) {
            setRedactedItems([{
              id: 'tfn-1',
              type: 'field',
              name: 'Tax File Number',
              value: 'TFN'
            }]);
          }
        }
      }
      
      setProcessingResults(results);
    } catch (error) {
      console.error('Error processing document:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Load retention policies
  const loadRetentionPolicies = async () => {
    setIsLoadingPolicies(true);
    setPoliciesError(null);
    
    try {
      // In a real implementation, this would be an API call to your backend
      // Mocked response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setRetentionPolicies([
        { id: 'policy1', name: 'Standard Retention', description: 'Standard 7-year retention', duration: 365 * 7 },
        { id: 'policy2', name: 'Extended Retention', description: 'Extended 10-year retention', duration: 365 * 10 },
        { id: 'policy3', name: 'Minimal Retention', description: '1-year retention for low importance docs', duration: 365 }
      ]);
    } catch (error) {
      console.error('Error loading retention policies:', error);
      setPoliciesError('Failed to load retention policies. Please try again.');
    } finally {
      setIsLoadingPolicies(false);
    }
  };
  
  // Apply redactions to the document (simplified, only works for images)
  const applyRedactions = async () => {
    if (!isImage || !preview || !canvasRef.current || redactedItems.length === 0) return;
    
    try {
      // Create a new image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Use a promise to wait for the image to load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Set up canvas
          const canvas = canvasRef.current!;
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image to the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // In a real implementation, we would use textract data to find the exact positions
          // For this demo, we'll just redact a random area
          
          // Apply a black rectangle as redaction
          // For demo purposes, redact 10% of the image from a random position
          const x = Math.random() * (canvas.width * 0.7);
          const y = Math.random() * (canvas.height * 0.7);
          const width = canvas.width * 0.3;
          const height = canvas.height * 0.1;
          
          ctx.fillStyle = 'black';
          ctx.fillRect(x, y, width, height);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          setProcessingResults(prev => ({
            ...prev,
            redactedImage: dataUrl
          }));
          
          resolve();
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = preview;
      });
    } catch (error) {
      console.error('Error applying redactions:', error);
    }
  };
  
  // Save documents
  const saveDocuments = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, we would save to an API endpoint
      // This is just a mock
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Document saved successfully!');
      
      // Reset the form
      setSelectedFile(null);
      setPreview(null);
      setProcessingResults({});
      setDocumentMetadata({
        documentType: '',
        documentSubType: '',
        dataSensitivity: 'internal',
        retentionPolicyId: '',
        customFields: []
      });
      setRedactedItems([]);
    } catch (error) {
      console.error('Error saving documents:', error);
      alert('Failed to save documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Load retention policies on component mount
  useEffect(() => {
    loadRetentionPolicies();
  }, []);
  
  // Helper function to convert days to years for display
  const daysToYears = (days: number) => Number((days / 365).toFixed(1));
  
  return (
    <div className="flex flex-col gap-6 p-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Document upload and preview */}
        <div className="flex flex-col gap-6">
          {/* Document upload section */}
          <Card extra="w-full p-6">
            <h2 className="text-lg font-semibold text-navy-700 dark:text-white mb-4">Upload Document</h2>
            
            {!selectedFile ? (
              <div
                className={`flex h-60 cursor-pointer items-center justify-center rounded-xl border border-dashed ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-navy-800'
                }`}
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
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <MdCloudUpload className="h-16 w-16 text-indigo-500 mb-2" />
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Drop your document here, or <span className="text-indigo-500">click to browse</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Supported formats: PDF, JPEG, PNG, TIFF
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                      <MdCloudUpload className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-700 dark:text-white">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button 
                    className="rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setProcessingResults({});
                    }}
                  >
                    <MdClose className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 flex flex-col rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-4">
                  <h3 className="text-base font-medium text-navy-700 dark:text-white mb-2">Document Preview</h3>
                  
                  {preview && (
                    <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-navy-900 rounded-lg">
                      <img 
                        src={preview}
                        alt="Document preview" 
                        className="max-w-full max-h-[300px] object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          
          {/* Document processing options */}
          {selectedFile && (
            <Card extra="w-full p-6">
              <h2 className="text-lg font-semibold text-navy-700 dark:text-white mb-4">Processing Options</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy-700 dark:text-white">Scan for TFN</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detect and handle Tax File Numbers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={scanForTFN}
                      onChange={() => setScanForTFN(!scanForTFN)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                      scanForTFN 
                        ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                        : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                      } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                      after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy-700 dark:text-white">Save Redacted Version</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Save a redacted copy with sensitive information hidden
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={saveRedactedVersion}
                      onChange={() => setSaveRedactedVersion(!saveRedactedVersion)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                      saveRedactedVersion 
                        ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                        : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                      } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                      after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                  </label>
                </div>
                
                <button
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={processDocument}
                  disabled={isProcessing || !selectedFile}
                >
                  {isProcessing ? 'Processing...' : 'Process Document'}
                </button>
              </div>
              
              {/* Processing results */}
              {processingResults.tfnDetection && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-navy-900">
                  <div className="flex items-center gap-2 mb-2">
                    <MdInfo className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-base font-medium text-navy-700 dark:text-white">Processing Results</h3>
                  </div>
                  
                  <div className="mt-2 flex gap-2 items-center">
                    {processingResults.tfnDetection.detected ? (
                      <>
                        <MdWarning className="h-5 w-5 text-amber-500" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {processingResults.tfnDetection.count || 'One or more'} TFN{processingResults.tfnDetection.count !== 1 ? 's' : ''} detected
                        </p>
                      </>
                    ) : (
                      <>
                        <MdCheck className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">No TFNs detected</p>
                      </>
                    )}
                  </div>
                  
                  {processingResults.tfnDetection.detected && (
                    <button
                      className="mt-3 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded flex items-center gap-1 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                      onClick={applyRedactions}
                    >
                      <MdHideImage className="h-4 w-4" />
                      Apply redactions
                    </button>
                  )}
                </div>
              )}
              
              {processingResults.redactedImage && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-navy-900">
                  <h3 className="text-base font-medium text-navy-700 dark:text-white mb-2">Redacted Document</h3>
                  <div className="flex items-center justify-center p-4 bg-white dark:bg-navy-800 rounded-lg">
                    <img 
                      src={processingResults.redactedImage}
                      alt="Redacted document" 
                      className="max-w-full max-h-[200px] object-contain"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
        
        {/* Right column - Document metadata and retention policy */}
        <div className="flex flex-col gap-6">
          {selectedFile && (
            <Card extra="w-full p-6">
              <h2 className="text-lg font-semibold text-navy-700 dark:text-white mb-4">Document Information</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={documentMetadata.documentType}
                    onChange={(e) => setDocumentMetadata({...documentMetadata, documentType: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                  >
                    <option value="">Select document type</option>
                    <option value="id">ID Document</option>
                    <option value="financial">Financial Document</option>
                    <option value="medical">Medical Record</option>
                    <option value="legal">Legal Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {documentMetadata.documentType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Subtype
                    </label>
                    <select
                      value={documentMetadata.documentSubType || ''}
                      onChange={(e) => setDocumentMetadata({...documentMetadata, documentSubType: e.target.value})}
                      className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                    >
                      <option value="">Select subtype</option>
                      {documentMetadata.documentType === 'id' && (
                        <>
                          <option value="passport">Passport</option>
                          <option value="drivers_license">Driver's License</option>
                          <option value="national_id">National ID</option>
                        </>
                      )}
                      {documentMetadata.documentType === 'financial' && (
                        <>
                          <option value="tax_return">Tax Return</option>
                          <option value="bank_statement">Bank Statement</option>
                          <option value="invoice">Invoice</option>
                        </>
                      )}
                      {documentMetadata.documentType === 'medical' && (
                        <>
                          <option value="prescription">Prescription</option>
                          <option value="medical_report">Medical Report</option>
                          <option value="insurance_claim">Insurance Claim</option>
                        </>
                      )}
                      {documentMetadata.documentType === 'legal' && (
                        <>
                          <option value="contract">Contract</option>
                          <option value="will">Will</option>
                          <option value="power_of_attorney">Power of Attorney</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Sensitivity
                  </label>
                  <select
                    value={documentMetadata.dataSensitivity}
                    onChange={(e) => setDocumentMetadata({...documentMetadata, dataSensitivity: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                  >
                    {sensitivityLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retention Policy
                  </label>
                  <select
                    value={documentMetadata.retentionPolicyId}
                    onChange={(e) => setDocumentMetadata({...documentMetadata, retentionPolicyId: e.target.value})}
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                    disabled={isLoadingPolicies}
                  >
                    <option value="">Select retention policy</option>
                    {isLoadingPolicies ? (
                      <option value="" disabled>Loading policies...</option>
                    ) : policiesError ? (
                      <option value="" disabled>Error loading policies</option>
                    ) : (
                      retentionPolicies.map(policy => (
                        <option key={policy.id} value={policy.id}>
                          {policy.name} ({daysToYears(policy.duration)} years)
                        </option>
                      ))
                    )}
                  </select>
                  {policiesError && (
                    <p className="text-xs text-red-500 mt-1">
                      {policiesError}
                      <button 
                        onClick={loadRetentionPolicies} 
                        className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                    rows={3}
                    placeholder="Add any additional information about this document"
                  />
                </div>
                
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Fields</h3>
                  <button
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-navy-600"
                    onClick={() => {
                      setDocumentMetadata({
                        ...documentMetadata,
                        customFields: [
                          ...documentMetadata.customFields,
                          { id: `field-${documentMetadata.customFields.length + 1}`, name: '', value: '' }
                        ]
                      });
                    }}
                  >
                    Add Custom Field
                  </button>
                  
                  {documentMetadata.customFields.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {documentMetadata.customFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Field name"
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...documentMetadata.customFields];
                              newFields[index].name = e.target.value;
                              setDocumentMetadata({...documentMetadata, customFields: newFields});
                            }}
                            className="flex-1 rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-1.5 px-2 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => {
                              const newFields = [...documentMetadata.customFields];
                              newFields[index].value = e.target.value;
                              setDocumentMetadata({...documentMetadata, customFields: newFields});
                            }}
                            className="flex-1 rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-1.5 px-2 text-sm"
                          />
                          <button
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            onClick={() => {
                              const newFields = documentMetadata.customFields.filter((_, i) => i !== index);
                              setDocumentMetadata({...documentMetadata, customFields: newFields});
                            }}
                          >
                            <MdClose className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          {/* Save button */}
          {selectedFile && (
            <Card extra="w-full p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-navy-700 dark:text-white">Save Document</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Save the document with the specified metadata and settings
                  </p>
                </div>
                <button
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={saveDocuments}
                  disabled={isProcessing || !selectedFile || !documentMetadata.documentType || !documentMetadata.retentionPolicyId}
                >
                  {isProcessing ? 'Saving...' : 'Save Document'}
                </button>
              </div>
              
              {/* Summary of what will be saved */}
              {selectedFile && documentMetadata.documentType && documentMetadata.retentionPolicyId && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-navy-900">
                  <h3 className="text-sm font-medium text-navy-700 dark:text-white mb-2">Summary</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Original document: {selectedFile.name}</li>
                    <li>• Document type: {documentMetadata.documentType}{documentMetadata.documentSubType ? ` / ${documentMetadata.documentSubType}` : ''}</li>
                    <li>• Data sensitivity: {sensitivityLevels.find(l => l.id === documentMetadata.dataSensitivity)?.name || documentMetadata.dataSensitivity}</li>
                    <li>• Retention policy: {retentionPolicies.find(p => p.id === documentMetadata.retentionPolicyId)?.name || 'Selected policy'}</li>
                    {processingResults.tfnDetection?.detected && saveRedactedVersion && (
                      <li>• Redacted version will be saved</li>
                    )}
                    {documentMetadata.customFields.length > 0 && (
                      <li>• {documentMetadata.customFields.length} custom field{documentMetadata.customFields.length !== 1 ? 's' : ''}</li>
                    )}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      
      {/* Hidden canvas for redaction processing */}
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
    </div>
  );
};

export default DocumentStoragePage;
