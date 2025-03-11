import { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdClose, MdDocumentScanner, MdWarning, MdKeyboardArrowDown } from 'react-icons/md';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { MdError } from 'react-icons/md';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';
import DocumentViewer from './DocumentViewer';

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
            confidence: llmResult.confidence || 0.9,
            reasoning: llmResult.reasoning || ""
          };
          
          // Override the main classification result with LLM result if available
          results.classification = {
            type: llmResult.documentType || llmResult.type || "",
            subType: llmResult.subType || "",
            confidence: llmResult.confidence || 0.9,
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
  
  return (
    <div>
      {/* File details section - always show */}
      <div className="mb-4 bg-gray-50 dark:bg-navy-700 p-3 rounded-lg">
        <p className="text-base font-medium text-gray-800 dark:text-white mb-1">
          {fileName}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {getShortFileType(fileType)} • {fileSize}
          </p>
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
      </div>
      
      {/* Only show classification UI if not already classified or if manual classification is enabled */}
      {(!isClassified || manualClassificationEnabled) && (
        <div className="mb-4">
          {/* Classification controls (only if user needs to manually classify) */}
          {(!autoClassifyValue || manualClassificationEnabled) && (
            <div className="mb-4">
              <div className="mb-3">
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
                    disabled={autoClassifyValue && !manualClassificationEnabled && isClassified}
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
          )}
          
          {/* Analysis options */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            {/* Auto-classify option */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Auto-classify
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Detect document type using AWS
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoClassifyValue} 
                  onChange={toggleAutoClassify} 
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                  autoClassifyValue 
                    ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                  } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
            
            {/* Text extraction option */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Text extraction
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Extract text using GPT
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useTextExtractionValue} 
                  onChange={toggleUseTextExtraction} 
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                  useTextExtractionValue 
                    ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                  } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
            
            {/* TFN scanning option */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Scan for TFN
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Detect Tax File Numbers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={scanForTFNValue} 
                  onChange={toggleScanForTFN} 
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                  scanForTFNValue 
                    ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                  } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>
          
          {/* Analyse button */}
          <button
            onClick={runSelectedProcesses}
            disabled={isAnalysing}
            className="w-full flex items-center justify-center py-2 px-6 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalysing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white inline-block"></span>
                Analysing...
              </>
            ) : (
              <>Analyse Document</>
            )}
          </button>
        </div>
      )}

      {/* Loading indicator during analysis */}
      {isAnalysing && (
        <div className="my-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-center">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-indigo-400"></div>
            <span className="ml-2 text-indigo-700 dark:text-indigo-300">Analysing document...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentClassification;