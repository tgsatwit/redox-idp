import { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdClose, MdDocumentScanner, MdWarning, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { MdError } from 'react-icons/md';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';
import DocumentViewer from './DocumentViewer';
import Switch from '@/components/switch';

interface DocumentClassificationProps {
  file?: File;
  onCancel?: () => void;
  onNext?: () => void;
  onClassify?: (results: any) => void;
  initialResults?: any;
  autoClassify?: boolean;
  useTextExtraction?: boolean;
  scanForTFN?: boolean;
  setAutoClassify?: (value: boolean) => void;
  setUseTextExtraction?: (value: boolean) => void;
  setScanForTFN?: (value: boolean) => void;
}

const DocumentClassification = ({ 
  file, 
  onCancel, 
  onNext, 
  onClassify,
  initialResults = {},
  autoClassify: externalAutoClassify,
  useTextExtraction: externalUseTextExtraction,
  scanForTFN: externalScanForTFN,
  setAutoClassify: externalSetAutoClassify,
  setUseTextExtraction: externalSetUseTextExtraction,
  setScanForTFN: externalSetScanForTFN
}: DocumentClassificationProps) => {
  const [internalAutoClassify, setInternalAutoClassify] = useState(true);
  const [internalUseTextExtraction, setInternalUseTextExtraction] = useState(false);
  const [internalScanForTFN, setInternalScanForTFN] = useState(false);
  const [manualClassifyOverride, setManualClassifyOverride] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const autoClassifyValue = externalAutoClassify !== undefined ? externalAutoClassify : internalAutoClassify;
  const useTextExtractionValue = externalUseTextExtraction !== undefined ? externalUseTextExtraction : internalUseTextExtraction;
  const scanForTFNValue = externalScanForTFN !== undefined ? externalScanForTFN : internalScanForTFN;
  
  const setAutoClassifyValue = externalSetAutoClassify || setInternalAutoClassify;
  const setUseTextExtractionValue = externalSetUseTextExtraction || setInternalUseTextExtraction;
  const setScanForTFNValue = externalSetScanForTFN || setInternalScanForTFN;
  
  const [isClassified, setIsClassified] = useState(!!initialResults.classification);
  const [documentType, setDocumentType] = useState<string>(initialResults.classification?.type || 'ID Document');
  const [documentSubType, setDocumentSubType] = useState<string>(initialResults.classification?.subType || 'Passport');
  const [analysisResult, setAnalysisResult] = useState<string | null>(initialResults.textractAnalyzeId || null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [manualClassificationEnabled, setManualClassificationEnabled] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    classification?: { type: string; subType: string; confidence: number; source: string };
    awsClassification?: { type: string; subType?: string; confidence: number };
    gptClassification?: { type: string; subType: string; confidence: number; reasoning?: string };
    textExtraction?: { success: boolean; text?: string; error?: string; mock?: boolean };
    tfnDetection?: { detected: boolean; count?: number; error?: string; mock?: boolean };
    textractAnalyzeId?: string;
    rawTextractData?: any;
    extractedFields?: any[];
  }>(initialResults);
  
  // Update internal state when initialResults prop changes
  useEffect(() => {
    if (initialResults && Object.keys(initialResults).length > 0) {
      setAnalysisResults(initialResults);
      
      if (initialResults.classification) {
        setIsClassified(true);
        setDocumentType(initialResults.classification.type || 'ID Document');
        setDocumentSubType(initialResults.classification.subType || 'Passport');
      }
      
      if (initialResults.textractAnalyzeId) {
        setAnalysisResult(initialResults.textractAnalyzeId);
      }
    }
  }, [initialResults]);
  
  // Get file details
  const fileType = file?.type || '';
  const fileSize = file ? `${Math.round(file.size / 1024)} KB` : '';
  const fileName = file?.name || '';
  
  // Get shortened file type for display
  const getShortFileType = (mimeType: string) => {
    const parts = mimeType.split('/');
    return parts.length > 1 ? parts[0] + '/' + parts[1] : mimeType;
  };

  // Determine if the file format is supported
  const isFormatSupported = file && (file.type.startsWith('image/') || file.type === 'application/pdf');

  // Mock document type options
  const documentTypeOptions = [
    "ID Document",
    "Financial Document",
    "Medical Record",
    "Legal Document",
    "Other"
  ];

  // Mock sub-type options based on document type
  const getSubTypeOptions = (type: string) => {
    switch (type) {
      case "ID Document":
        return ["Passport", "Driver's License", "National ID", "Birth Certificate"];
      case "Financial Document":
        return ["Invoice", "Bank Statement", "Tax Return", "Receipt"];
      case "Medical Record":
        return ["Prescription", "Medical Report", "Insurance Claim", "Lab Result"];
      case "Legal Document":
        return ["Contract", "Affidavit", "Power of Attorney", "Court Order"];
      default:
        return ["General", "Miscellaneous"];
    }
  };

  // Handle change of document type
  const handleDocumentTypeChange = (type: string) => {
    setDocumentType(type);
    // Reset subtype to the first option when type changes
    setDocumentSubType(getSubTypeOptions(type)[0]);
  };

  // Function to run all selected processes
  const runSelectedProcesses = async () => {
    if (!file) return;
    
    setIsAnalysing(true);
    setAnalysisResults({});
    const results: any = {};
    
    try {
      // Create form data for sending the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Step 1: ALWAYS use AWS Textract to extract text from the document
      const textractResponse = await fetch('/api/docs-2-analyse/analyse-document', {
        method: 'POST',
        body: formData
      });
      
      if (!textractResponse.ok) {
        const errorData = await textractResponse.json();
        throw new Error(errorData.error || 'Text extraction failed');
      }
      
      const textractData = await textractResponse.json();
      results.textExtraction = {
        success: true,
        text: textractData.extractedText
      };
      
      // Store the raw Textract response for the JSON tab
      results.rawTextractData = textractData.textractResponse;
      
      // Store any extracted fields
      if (textractData.extractedFields && textractData.extractedFields.length > 0) {
        results.extractedFields = textractData.extractedFields;
      }

      // Store the Textract Job ID if available
      if (textractData.textractResponse?.JobId) {
        results.textractAnalyzeId = textractData.textractResponse.JobId;
      }
      
      // Step 2: If auto-classify is enabled, use AWS Comprehend for classification
      if (autoClassifyValue) {
        const classifyResponse = await fetch('/api/docs-2-analyse/classify-comprehend', {
          method: 'POST',
          body: formData
        });
        
        if (!classifyResponse.ok) {
          const errorData = await classifyResponse.json();
          throw new Error(errorData.error || 'Classification failed');
        }
        
        const classificationResult = await classifyResponse.json();
        results.awsClassification = {
          type: classificationResult.dominant,
          subType: null,
          confidence: classificationResult.dominantScore || 1.0
        };
        
        // Set the main classification result using AWS result
        results.classification = {
          type: classificationResult.dominant,
          subType: "",
          confidence: classificationResult.dominantScore || 1.0,
          source: 'AWS Comprehend'
        };
      }
      
      // Step 3: If text extraction option is enabled, try to classify with LLM
      if (useTextExtractionValue) {
        const llmResponse = await fetch('/api/docs-2-analyse/classify-llm', {
          method: 'POST',
          body: JSON.stringify({
            text: textractData.extractedText,
            availableTypes: documentTypeOptions,
            fileName: file.name
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (llmResponse.ok) {
          const llmResult = await llmResponse.json();
          results.gptClassification = {
            type: llmResult.documentType || llmResult.type || "",
            subType: llmResult.subType || "",
            reasoning: llmResult.reasoning || ""
          };
          
          // Override the main classification result with LLM result if available
          results.classification = {
            type: llmResult.documentType || llmResult.type || "",
            subType: llmResult.subType || "",
            source: 'OpenAI'
          };
        } else {
          console.warn('LLM classification failed, keeping AWS classification if available');
        }
      }
      
      // Step 4: If scan for TFN is enabled, check for TFNs
      if (scanForTFNValue) {
        const tfnResponse = await fetch('/api/docs-2-analyse/scan-for-tfn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text: textractData.extractedText 
          })
        });
        
        if (tfnResponse.ok) {
          const tfnResult = await tfnResponse.json();
          results.tfnDetection = {
            detected: tfnResult.tfnIdentified,
            count: tfnResult.tfnCount || 0
          };
        } else {
          console.warn('TFN detection failed');
          results.tfnDetection = {
            detected: false,
            error: 'TFN detection failed'
          };
        }
      }
      
      setAnalysisResults(results);
      setIsClassified(true);
      setAnalysisResult('ANALYSIS_COMPLETE');
      
      if (onClassify) {
        onClassify(results);
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult('ERROR');
    } finally {
      setIsAnalysing(false);
    }
  };
  
  const toggleAutoClassify = () => {
    setAutoClassifyValue(!autoClassifyValue);
  };
  
  const toggleUseTextExtraction = () => {
    setUseTextExtractionValue(!useTextExtractionValue);
  };
  
  const toggleScanForTFN = () => {
    setScanForTFNValue(!scanForTFNValue);
  };

  // Toggle manual classification override
  const toggleManualClassify = () => {
    setManualClassifyOverride(!manualClassifyOverride);
  };
  
  // Function to handle manual classification
  const applyManualClassification = () => {
    const updatedResults = {...analysisResults};
    updatedResults.classification = {
      type: documentType,
      subType: documentSubType,
      confidence: 1.0, // Full confidence for manual classification
      source: 'Manual'
    };
    
    setAnalysisResults(updatedResults);
    setIsClassified(true);
    
    if (onClassify) {
      onClassify(updatedResults);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            {isCollapsed ? <MdKeyboardArrowDown size={20} /> : <MdKeyboardArrowUp size={20} />}
          </button>
          <h3 className="text-xl font-bold text-navy-700 dark:text-white">Document Classification</h3>
        </div>
        <div>
          {analysisResults.classification ? (
            analysisResults.classification.type === 'undefined' ? (
              <ClickablePillLabel
                label="undefined"
                icon={<MdError />}
                iconColor="text-red-500"
                bg="bg-[#FDE0D0] dark:!bg-navy-700"
                mb="mb-0"
                onClick={() => {}}
              />
            ) : (
              <ClickablePillLabel
                label={analysisResults.classification.type}
                icon={<BsFillCheckCircleFill />}
                iconColor="text-green-500"
                bg="bg-[#C9FBD5] dark:!bg-navy-700"
                mb="mb-0"
                onClick={() => {}}
              />
            )
          ) : (
            <ClickablePillLabel
              label="Unclassified"
              icon={<MdWarning />}
              iconColor="text-amber-500"
              bg="bg-[#FFF6DA] dark:!bg-navy-700"
              mb="mb-0"
              onClick={() => {}}
            />
          )}
        </div>
      </div>

      {/* File details section - always show */}
        {!isCollapsed && (
          <div className="bg-white dark:bg-navy-900 rounded p-4">
            {/* File details section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-white">
                    {fileName}
                  </p>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-400">
                    {getShortFileType(fileType)} • {fileSize}
                  </p>
                </div>
                {isFormatSupported ? (
                  <ClickablePillLabel
                    label="Supported Format"
                    icon={<BsFillCheckCircleFill />}
                    iconColor="text-green-500"
                    bg="bg-[#C9FBD5] dark:!bg-navy-700"
                    mb="mb-0"
                    onClick={() => {}}
                  />
                ) : (
                  <ClickablePillLabel
                    label="Unsupported Format"
                    icon={<MdError />}
                    iconColor="text-red-500"
                    bg="bg-[#FDE0D0] dark:!bg-navy-700"
                    mb="mb-0"
                    onClick={() => {}}
                  />
                )}
              </div>
              
              {/* Status indicators */}
              <div className="flex flex-wrap gap-2">
                {/* Text Extraction Status */}
                <div className="inline-flex items-center px-2 py-1 rounded">
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    !analysisResults.textExtraction
                      ? 'bg-amber-500'
                      : analysisResults.textExtraction.success 
                        ? 'bg-green-500'
                        : 'bg-red-500'
                  }`}></div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {!analysisResults.textExtraction
                      ? "Text extraction pending"
                      : analysisResults.textExtraction.success
                        ? "Text successfully extracted"
                        : "Text extraction failed"}
                  </p>
                </div>
                
                {/* TFN Status */}
                <div className="inline-flex items-center px-2 py-1 rounded">
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    !analysisResults.tfnDetection
                      ? 'bg-amber-500'
                      : analysisResults.tfnDetection.detected 
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}></div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {!analysisResults.tfnDetection
                      ? "TFN detection pending"
                      : analysisResults.tfnDetection.detected
                        ? `TFN: ${analysisResults.tfnDetection.count} found`
                        : "No TFNs detected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Classification section */}
            <div className="border-t border-gray-100 dark:border-navy-600">
              <div className="p-4">
                <p className="text-sm font-medium text-gray-800 dark:text-white mb-4">
                  Current Classification:
                </p>

                {/* Classification Results */}
                {analysisResults.classification && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-4">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type:</p>
                      <div className="inline-flex items-center">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {analysisResults.classification.type || "undefined"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sub-type:</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {analysisResults.classification.subType || "Unknown"}
                      </p>
                    </div>
                    
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence:</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {analysisResults.classification.confidence 
                          ? `${(analysisResults.classification.confidence * 100).toFixed(0)}%` 
                          : '100%'}
                      </p>
                    </div>
                    
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Source:</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {analysisResults.classification.source}
                      </p>
                    </div>
                  </div>
                )}

                {/* Manual Classification Toggle */}
                <div className="flex items-center border-t border-gray-100 dark:border-navy-600 pt-4">
                  <label htmlFor="manual-classify" className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                    Manually Classify/Override
                  </label>
                  <Switch 
                    id="manual-classify"
                    checked={manualClassifyOverride}
                    onChange={toggleManualClassify}
                    color="indigo"
                  />
                </div>

                {/* Manual Classification UI */}
                {manualClassifyOverride && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Document Type
                        </label>
                        <div className="relative">
                          <select
                            value={documentType}
                            onChange={(e) => handleDocumentTypeChange(e.target.value)}
                            className="block w-full rounded-md border-gray-300 bg-white dark:bg-navy-800 py-2 pl-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none [&::-ms-expand]:hidden"
                          >
                            {documentTypeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <MdKeyboardArrowDown size={20} />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Document Sub-type
                        </label>
                        <div className="relative">
                          <select
                            value={documentSubType}
                            onChange={(e) => setDocumentSubType(e.target.value)}
                            className="block w-full rounded-md border-gray-300 bg-white dark:bg-navy-800 py-2 pl-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none [&::-ms-expand]:hidden"
                          >
                            {getSubTypeOptions(documentType).map((subType) => (
                              <option key={subType} value={subType}>
                                {subType}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <MdKeyboardArrowDown size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={applyManualClassification}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Apply Classification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* "Not yet classified" message - show when not classified and not in manual override mode */}
      {!isClassified && !manualClassifyOverride && (
        <div className="text-center py-3 bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Document not yet classified
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentClassification;