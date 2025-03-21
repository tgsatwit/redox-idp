import { useState, useEffect } from 'react';
import Card from '@/components/card';
import { MdClose, MdDocumentScanner, MdWarning, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { MdError } from 'react-icons/md';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';
import DocumentViewer from './DocumentViewer';
import Switch from '@/components/switch';
import { ClassificationResult } from '@/lib/types';

interface DocumentType {
  id: string;
  name: string;
  description?: string;
}

interface DocumentSubType {
  id: string;
  name: string;
  description?: string;
  documentTypeId: string;
}

// Helper function to check if a classification is valid
const isValidClassification = (classification?: { type: string; subType?: string }) => {
  if (!classification) return false;
  
  // Check if type is valid (not empty, undefined, or "Unknown")
  const isTypeValid = !!classification.type && 
    classification.type.toLowerCase() !== "unknown" && 
    classification.type.toLowerCase() !== "undefined" &&
    classification.type.trim() !== "";
  
  // For subType, we're primarily checking it's not empty if the type is valid
  // Some document types might not have subTypes, so we're less strict here
  return isTypeValid;
};

interface DocumentClassificationProps {
  file?: File;
  onCancel?: () => void;
  onNext?: () => void;
  onClassify?: (results: any) => void;
  initialResults?: any;
  autoClassify?: boolean;
  useTextExtraction?: boolean;
  scanForTFN?: boolean;
  conductFraudCheck?: boolean;
  setAutoClassify?: (value: boolean) => void;
  setUseTextExtraction?: (value: boolean) => void;
  setScanForTFN?: (value: boolean) => void;
  setConductFraudCheck?: (value: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (value: boolean) => void;
}

// Define a helper type for processed document types
interface ProcessedDocumentType {
  id: string;
  name: string;
  description: string;
  subTypes: DocumentSubType[];
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
  conductFraudCheck: externalConductFraudCheck,
  setAutoClassify: externalSetAutoClassify,
  setUseTextExtraction: externalSetUseTextExtraction,
  setScanForTFN: externalSetScanForTFN,
  setConductFraudCheck: externalSetConductFraudCheck,
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed
}: DocumentClassificationProps) => {
  const [internalAutoClassify, setInternalAutoClassify] = useState(true);
  const [internalUseTextExtraction, setInternalUseTextExtraction] = useState(false);
  const [internalScanForTFN, setInternalScanForTFN] = useState(false);
  const [internalConductFraudCheck, setInternalConductFraudCheck] = useState(false);
  const [manualClassifyOverride, setManualClassifyOverride] = useState(false);
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  
  const autoClassifyValue = externalAutoClassify !== undefined ? externalAutoClassify : internalAutoClassify;
  const useTextExtractionValue = externalUseTextExtraction !== undefined ? externalUseTextExtraction : internalUseTextExtraction;
  const scanForTFNValue = externalScanForTFN !== undefined ? externalScanForTFN : internalScanForTFN;
  const conductFraudCheckValue = externalConductFraudCheck !== undefined ? externalConductFraudCheck : internalConductFraudCheck;
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  
  const setAutoClassifyValue = externalSetAutoClassify || setInternalAutoClassify;
  const setUseTextExtractionValue = externalSetUseTextExtraction || setInternalUseTextExtraction;
  const setScanForTFNValue = externalSetScanForTFN || setInternalScanForTFN;
  const setConductFraudCheckValue = externalSetConductFraudCheck || setInternalConductFraudCheck;
  const setIsCollapsed = externalSetIsCollapsed || setInternalIsCollapsed;
  
  const [isClassified, setIsClassified] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentSubType, setDocumentSubType] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
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
  }>({});
  
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentSubTypes, setDocumentSubTypes] = useState<DocumentSubType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
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

  // Fetch document types from DynamoDB
  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch('/api/update-config/document-types');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch document types');
      }
      const data = await response.json();
      // If data items don't have an 'id' property, assume they are strings and convert them
      const convertedData =
        Array.isArray(data) && data.length > 0 && (!data[0].id)
          ? data.map((name: string) => ({ id: name, name, description: '', subTypes: [] }))
          : data;
      setDocumentTypes(convertedData);
      return convertedData;
    } catch (error) {
      console.error('Error fetching document types:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load document types');
      return [];
    }
  };

  // Fetch sub-types for a specific document type
  const fetchSubTypes = async (docTypeId: string) => {
    try {
      const response = await fetch(`/api/update-config/document-types/${docTypeId}/sub-types`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sub-types');
      }
      const data = await response.json();
      setDocumentSubTypes(data);
      return data;
    } catch (error) {
      console.error('Error fetching sub-types:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load document sub-types');
      return [];
    }
  };

  // Load document types on component mount
  useEffect(() => {
    const loadDocumentTypes = async () => {
      setIsLoadingTypes(true);
      setLoadError(null);
      try {
        console.log('Loading document types...');
        const types = await fetchDocumentTypes();
        console.log('Loaded document types:', types);

        if (types.length > 0) {
          setDocumentType(types[0].name);
          console.log('Loading sub-types for:', types[0].id);
          const subTypes = await fetchSubTypes(types[0].id);
          console.log('Loaded sub-types:', subTypes);
          setDocumentSubTypes(subTypes);
        } else {
          setLoadError('No document types found');
        }
      } catch (error) {
        console.error('Error loading document types:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load document types');
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadDocumentTypes();
  }, []);

  // Load sub-types when document type changes
  useEffect(() => {
    const loadSubTypes = async () => {
      setIsLoadingTypes(true);
      setLoadError(null);
      try {
        const selectedType = documentTypes.find(type => type.name === documentType);
        if (selectedType) {
          console.log('Loading sub-types for document type:', selectedType.id);
          const subTypes = await fetchSubTypes(selectedType.id);
          console.log('Loaded sub-types:', subTypes);
          setDocumentSubTypes(subTypes);

          if (subTypes.length > 0) {
            setDocumentSubType(subTypes[0].name);
          } else {
            console.log('No sub-types found for document type:', selectedType.id);
            setDocumentSubTypes([]);
          }
        }
      } catch (error) {
        console.error('Error loading sub-types:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load document sub-types');
      } finally {
        setIsLoadingTypes(false);
      }
    };

    if (documentType && documentTypes.length > 0) {
      loadSubTypes();
    }
  }, [documentType, documentTypes]);

  // Handle change of document type
  const handleDocumentTypeChange = (typeName: string) => {
    setDocumentType(typeName);
    // Sub-types will be loaded by the useEffect above
  };

  // Update the classification state and UI
  const updateClassification = (classification: { type: string; subType: string; confidence: number; source: string }) => {
    if (!classification?.type) return;
    
    // Validate the classification before proceeding
    if (!isValidClassification(classification)) {
      console.warn('Invalid classification received:', classification);
      return;
    }

    // Update the analysis results
    const updatedResults = {
      ...analysisResults,
      classification: {
        type: classification.type,
        subType: classification.subType || '',
        confidence: classification.confidence,
        source: classification.source
      }
    };
    
    setAnalysisResults(updatedResults);
    setIsClassified(true);
    setDocumentType(classification.type);
    setDocumentSubType(classification.subType || '');
    
    if (onClassify) {
      onClassify(updatedResults);
    }
  };

  // Function to run all selected processes
  const runSelectedProcesses = async () => {
    if (!file) return;
    
    setIsAnalysing(true);
    setAnalysisResults({});
    setIsClassified(false);
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
      
      // Store the raw Textract response and extracted fields
      results.rawTextractData = textractData.textractResponse;
      if (textractData.extractedFields?.length > 0) {
        results.extractedFields = textractData.extractedFields;
      }
      if (textractData.textractResponse?.JobId) {
        results.textractAnalyzeId = textractData.textractResponse.JobId;
      }
      
      // Step 2: AWS Comprehend Classification
      if (autoClassifyValue) {
        const classifyFormData = new FormData();
        classifyFormData.append('file', file);
        
        // Create proper document type config for Comprehend
        const comprehendDocTypes = documentTypes.map(type => ({
          id: type.id,
          name: type.name,
          subTypes: documentSubTypes
            .filter(subType => subType.documentTypeId === type.id)
            .map(subType => ({
              id: subType.id,
              name: subType.name
            }))
        }));
        
        classifyFormData.append('documentTypes', JSON.stringify(comprehendDocTypes));
        
        const classifyResponse = await fetch('/api/docs-2-analyse/classify-comprehend', {
          method: 'POST',
          body: classifyFormData
        });
        
        if (classifyResponse.ok) {
          const classificationResult = await classifyResponse.json();
          
          // Validate the AWS classification result
          const awsType = classificationResult.dominant || '';
          const isValidAwsType = awsType.toLowerCase() !== 'unknown' && 
                                 awsType.toLowerCase() !== 'undefined' && 
                                 awsType.trim() !== '';
          
          if (!isValidAwsType) {
            console.warn('AWS Comprehend returned invalid document type:', awsType);
            return;
          }
          
          // Find the matching document type
          const matchedType = documentTypes.find(type => 
            type.name.toLowerCase() === awsType.toLowerCase()
          );
          
          if (matchedType) {
            // Find available sub-types for this document type
            const availableSubTypes = documentSubTypes.filter(
              subType => subType.documentTypeId === matchedType.id
            );
            
            const classification = {
              type: matchedType.name,
              subType: availableSubTypes.length > 0 ? availableSubTypes[0].name : '',
              confidence: classificationResult.dominantScore || 1.0,
              source: 'AWS Comprehend'
            };
            
            updateClassification(classification);
          } else {
            console.warn('AWS Comprehend returned a document type that does not match any known type:', awsType);
          }
        }
      }
      
      // Step 3: LLM Classification
      if (useTextExtractionValue) {
        const documentTypeConfig = documentTypes.map((type) => ({
          id: type.id,
          name: type.name,
          description: type.description || '',
          subTypes: documentSubTypes
            .filter((subType) => subType.documentTypeId === type.id)
            .map((subType) => ({
              id: subType.id,
              name: subType.name,
              description: subType.description || ''
            }))
        }));

        console.log('Structured document types sent to LLM:', JSON.stringify(documentTypeConfig, null, 2));

        const llmResponse = await fetch('/api/docs-2-analyse/classify-llm', {
          method: 'POST',
          body: JSON.stringify({
            text: textractData.extractedText,
            availableTypes: documentTypeConfig,
            fileName: file.name
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (llmResponse.ok) {
          const llmResult = await llmResponse.json();
          console.log('LLM Classification Result:', llmResult);

          const matchedType = documentTypeConfig.find((type) =>
            type.name.toLowerCase() === (llmResult.documentType || '').toLowerCase()
          );

          const matchedSubType = matchedType?.subTypes.find((subType) =>
            subType.name.toLowerCase() === (llmResult.subType || '').toLowerCase()
          );

          // Get the type name and validate it
          const typeName = matchedType?.name || llmResult.documentType || '';
          const isValidType = typeName.toLowerCase() !== 'unknown' && 
                              typeName.toLowerCase() !== 'undefined' && 
                              typeName.trim() !== '';
          
          if (isValidType) {
            const classification = {
              type: typeName,
              subType: matchedSubType?.name || llmResult.subType || '',
              confidence: llmResult.confidence || 0.9,
              source: 'OpenAI'
            };

            updateClassification(classification);
          } else {
            console.warn('LLM returned invalid document type:', typeName);
            setIsAnalysing(false);
          }
        } else {
          console.error('LLM classification failed:', await llmResponse.text());
        }
      }
      
      // Step 4: TFN Detection
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
        }
      }
      
      setAnalysisResult('ANALYSIS_COMPLETE');
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult('ERROR');
      setIsClassified(false);
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
  
  const toggleConductFraudCheck = () => {
    setConductFraudCheckValue(!conductFraudCheckValue);
  };

  // Toggle manual classification override
  const toggleManualClassify = () => {
    setManualClassifyOverride(!manualClassifyOverride);
  };
  
  // Function to handle manual classification
  const applyManualClassification = async () => {
    const classification = {
      type: documentType,
      subType: documentSubType,
      confidence: 1.0,
      source: 'Manual'
    };
    
    // Update local UI state
    updateClassification(classification);
    
    // Submit feedback to train model
    try {
      // If file exists, use its name as documentId
      const documentId = file?.name || 'unknown_document';
      
      // Get the original classification from analysis results if it exists
      const originalClassification: ClassificationResult | null = analysisResults.classification 
        ? {
            documentType: analysisResults.classification.type,
            confidence: analysisResults.classification.confidence
          }
        : null;
      
      // Send the feedback to the API
      const response = await fetch('/api/train-models/classification-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          originalClassification,
          correctedDocumentType: documentType,
          documentSubType,
          feedbackSource: 'manual',
          timestamp: Date.now()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Classification feedback submission failed:', errorData);
      } else {
        console.log('Classification feedback submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting classification feedback:', error);
    }
  };
  
  // Replace the documentTypeOptions and getSubTypeOptions with the fetched data
  const availableDocumentTypes = documentTypes.map(type => type.name);
  const availableSubTypes = documentSubTypes.map(subType => subType.name);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-navy-700 dark:text-white">Document Classification</h3>
        <div className="flex items-center gap-2">
          <div>
            {analysisResults.classification ? (
              isValidClassification(analysisResults.classification) ? (
                <ClickablePillLabel
                  label={analysisResults.classification.type}
                  icon={<BsFillCheckCircleFill />}
                  iconColor="text-green-500"
                  bg="bg-[#C9FBD5] dark:!bg-navy-700"
                  mb="mb-0"
                  onClick={() => {}}
                />
              ) : (
                <ClickablePillLabel
                  label="Invalid Classification"
                  icon={<MdError />}
                  iconColor="text-red-500"
                  bg="bg-[#FDE0D0] dark:!bg-navy-700"
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
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700"
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
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
                        <p className={`text-sm font-medium ${
                          isValidClassification(analysisResults.classification) 
                            ? 'text-gray-800 dark:text-white' 
                            : 'text-red-500 dark:text-red-400'
                        }`}>
                          {analysisResults.classification.type || "undefined"}
                          {!isValidClassification(analysisResults.classification) && 
                            <span className="ml-2 text-xs text-red-500 dark:text-red-400">(Invalid)</span>
                          }
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

                {/* Warning message for invalid classification */}
                {analysisResults.classification && !isValidClassification(analysisResults.classification) && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md text-red-600 dark:text-red-400 text-sm">
                    <p className="font-medium">Invalid Classification</p>
                    <p className="mt-1">
                      The current classification is not valid. "Unknown" or empty classifications are not accepted.
                      Please use the manual classification option below or re-analyse the document.
                    </p>
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
                          {isLoadingTypes ? (
                            <div className="block w-full rounded-md border-gray-300 bg-gray-100 dark:bg-navy-700 py-2 pl-3 pr-10 text-gray-500">
                              Loading...
                            </div>
                          ) : (
                            <select
                              value={documentType}
                              onChange={(e) => handleDocumentTypeChange(e.target.value)}
                              className="block w-full rounded-md border-gray-300 bg-white dark:bg-navy-800 py-2 pl-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none [&::-ms-expand]:hidden"
                            >
                              {availableDocumentTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          )}
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
                          {isLoadingTypes ? (
                            <div className="block w-full rounded-md border-gray-300 bg-gray-100 dark:bg-navy-700 py-2 pl-3 pr-10 text-gray-500">
                              Loading...
                            </div>
                          ) : (
                            <select
                              value={documentSubType}
                              onChange={(e) => setDocumentSubType(e.target.value)}
                              className="block w-full rounded-md border-gray-300 bg-white dark:bg-navy-800 py-2 pl-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none [&::-ms-expand]:hidden"
                            >
                              {availableSubTypes.map((subType) => (
                                <option key={subType} value={subType}>
                                  {subType}
                                </option>
                              ))}
                            </select>
                          )}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <MdKeyboardArrowDown size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {loadError && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {loadError}
                      </div>
                    )}
                    
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
    </div>
  );
};

export default DocumentClassification;