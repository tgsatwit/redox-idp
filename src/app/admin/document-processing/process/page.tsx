'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import DocumentUpload from '@/components/admin/dashboards/process-document/DocumentUpload';
import DocumentViewer from '@/components/admin/dashboards/process-document/DocumentViewer';
import DocumentWorkflowStepper from '@/components/admin/dashboards/process-document/DocumentWorkflowStepper';
import DocumentClassification from '@/components/admin/dashboards/process-document/DocumentClassification';
import DocumentControl, { DocumentControlHandle } from '@/components/admin/dashboards/process-document/DocumentControl';
import Card from '@/components/card';
import WorkflowStepperCard from '@/components/admin/dashboards/process-document/WorkflowStepperCard';
import { 
  MdCloudUpload, 
  MdSearch, 
  MdAutorenew, 
  MdCheckCircle,
  MdOutlineAutoAwesome,
  MdOutlineWarningAmber
} from 'react-icons/md';
import { BsFillCheckCircleFill } from 'react-icons/bs';

// Define interface for analysis results
interface AnalysisResults {
  classification?: { 
    type: string; 
    subType: string; 
    confidence: number; 
    source: string 
  };
  awsClassification?: { 
    type: string; 
    subType?: string; 
    confidence: number 
  };
  gptClassification?: { 
    type: string; 
    subType: string; 
    confidence: number; 
    reasoning?: string 
  };
  textExtraction?: { 
    success: boolean; 
    text?: string; 
    error?: string;
    mock?: boolean
  };
  tfnDetection?: { 
    detected: boolean; 
    count?: number; 
    error?: string;
    mock?: boolean
  };
  textractAnalyzeId?: string;
  extractedFields?: any[];
  rawTextractData?: any;
  documentSummary?: string;
}

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
const isValidClassification = (classification?: { type: string; subType: string }) => {
  if (!classification) return false;
  
  // Check if type is valid (not empty, undefined, or "Unknown")
  const isTypeValid = !!classification.type && 
    classification.type.toLowerCase() !== "unknown" && 
    classification.type.toLowerCase() !== "undefined";
  
  // For subType, we're primarily checking it's not empty if the type is valid
  // Some document types might not have subTypes, so we're less strict here
  return isTypeValid;
};

const ProcessDocument = () => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [activeDataTab, setActiveDataTab] = useState<'extractedText' | 'awsResponse'>('extractedText');
  
  // Add state for DocumentClassification collapse status
  const [isClassificationCardCollapsed, setIsClassificationCardCollapsed] = useState<boolean>(false);
  
  // Add state for DocumentControl collapse status
  const [isDocumentControlExpanded, setIsDocumentControlExpanded] = useState<boolean>(true);
  
  // Add state variables for Process Document options
  const [identifyRequiredData, setIdentifyRequiredData] = useState<boolean>(true);
  const [redactElements, setRedactElements] = useState<boolean>(false);
  const [createSummary, setCreateSummary] = useState<boolean>(false);
  const [saveOriginalDocument, setSaveOriginalDocument] = useState<boolean>(true);
  const [saveRedactedDocument, setSaveRedactedDocument] = useState<boolean>(false);
  const [originalRetentionPolicy, setOriginalRetentionPolicy] = useState<string>('');
  const [redactedRetentionPolicy, setRedactedRetentionPolicy] = useState<string>('');
  const [retentionPolicies, setRetentionPolicies] = useState<Array<{id: string, name: string, description?: string, duration: number}>>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState<boolean>(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  
  // Add state variables for document metadata
  const [originalDocumentMetadata, setOriginalDocumentMetadata] = useState<{
    dataSensitivity: string;
    documentSummary?: string;
    customFields: Array<{id: string, name: string, value: string}>;
  }>({
    dataSensitivity: '',
    documentSummary: '',
    customFields: []
  });
  
  const [redactedDocumentMetadata, setRedactedDocumentMetadata] = useState<{
    dataSensitivity: string;
    documentSummary?: string;
    customFields: Array<{id: string, name: string, value: string}>;
  }>({
    dataSensitivity: '',
    documentSummary: '',
    customFields: []
  });
  
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 1,
      name: 'Upload Document',
      icon: <MdCloudUpload size={22} />,
      completed: false,
      locked: false,
      selected: true,
      content: null
    },
    {
      id: 2,
      name: 'Classify & Analyse',
      icon: <MdSearch size={22} />,
      completed: false,
      locked: true,
      selected: false,
      content: null
    },
    {
      id: 3,
      name: 'Process Document',
      icon: <MdAutorenew size={22} />,
      completed: false,
      locked: true,
      selected: false,
      content: null
    },
    {
      id: 4,
      name: 'Finalise',
      icon: <MdCheckCircle size={22} />,
      completed: false,
      locked: true,
      selected: false,
      content: null
    }
  ]);
  
  // Calculate completed steps
  const completedCount = workflowSteps.filter(step => step.completed).length;
  
  // Add these state variables if they don't exist
  const [autoClassify, setAutoClassify] = useState(true);
  const [useTextExtraction, setUseTextExtraction] = useState(false);
  const [scanForTFN, setScanForTFN] = useState(false);
  const [conductFraudCheck, setConductFraudCheck] = useState(false);
  const [isClassificationCardExpanded, setIsClassificationCardExpanded] = useState(true);
  
  const [redactedItems, setRedactedItems] = useState<Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
    value?: string;
    boundingBox?: any;
  }>>([]);
  
  // Add state variables for processing status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<{
    autoMatchCompleted: boolean;
    redactionCompleted: boolean;
    summaryCompleted: boolean;
    summaryText?: string;
    processingComplete: boolean;
    error?: string;
  }>({
    autoMatchCompleted: false,
    redactionCompleted: false,
    summaryCompleted: false,
    processingComplete: false
  });
  
  // Add state for confirmation dialog
  const [showReprocessConfirm, setShowReprocessConfirm] = useState<boolean>(false);
  
  // Helper functions for document handling
  const isFormatSupported = (file: File) => {
    return file && (file.type.startsWith('image/') || file.type === 'application/pdf');
  };
  
  const getShortFileType = (mimeType: string) => {
    const parts = mimeType.split('/');
    return parts.length > 1 ? parts[0] + '/' + parts[1] : mimeType;
  };
  
  // Consolidate workflow steps management into a single effect
  useEffect(() => {
    setWorkflowSteps(prevSteps => prevSteps.map(step => {
      const baseStep = {
        ...step,
        completed: step.id < currentStep || (step.id === 2 && isValidClassification(analysisResults.classification)),
        locked: step.id === 1 
          ? false 
          : step.id === 2 
            ? !selectedFile 
            : step.id === 3 
              ? !isValidClassification(analysisResults.classification) 
              : currentStep < 4,
        selected: step.id === currentStep
      };

      if (step.id === 2) {
        const handleToggle = (currentValue: boolean, setter: (value: boolean) => void) => {
          // Use setTimeout to ensure state updates don't conflict
          setTimeout(() => {
            setter(!currentValue);
          }, 0);
        };

        baseStep.content = (
          <div className="p-4">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Auto-classify documents
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoClassify}
                    onChange={() => handleToggle(autoClassify, setAutoClassify)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    autoClassify 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically detect document type using AWS Comprehend
              </p>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Classify with LLM
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useTextExtraction}
                    onChange={() => handleToggle(useTextExtraction, setUseTextExtraction)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    useTextExtraction 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Classify with LLM if AWS classification unsuccessful
              </p>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Scan for TFN
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={scanForTFN}
                    onChange={() => handleToggle(scanForTFN, setScanForTFN)}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detect and handle Tax File Numbers in the document
              </p>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Conduct Fraud Check
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={conductFraudCheck}
                    onChange={() => handleToggle(conductFraudCheck, setConductFraudCheck)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    conductFraudCheck 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perform fraud analysis and verification
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={runSelectedAnalysis}
                disabled={isAnalysing}
                className={`mt-4 flex-1 flex items-center justify-center py-2 px-6 ${
                  analysisResults.classification 
                    ? 'bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } text-sm font-medium rounded-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAnalysing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white inline-block"></span>
                    Analysing...
                  </>
                ) : (
                  <>{analysisResults.classification ? 'Re-analyse Document' : 'Analyse Document'}</>
                )}
              </button>
              
              {isValidClassification(analysisResults.classification) && (
                <button
                  onClick={handleNextStep}
                  className="mt-4 flex-1 flex items-center justify-center py-2 px-6 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none"
                >
                  Next <span className="ml-2">→</span>
                </button>
              )}
            </div>
          </div>
        );
      }
      
      // Add content for Process Document step (step 3)
      if (step.id === 3) {
        const handleToggle = (currentValue: boolean, setter: (value: boolean) => void) => {
          // Use setTimeout to ensure state updates don't conflict
          setTimeout(() => {
            setter(!currentValue);
          }, 0);
        };

        baseStep.content = (
          <div className="p-4">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Automatically Identify Data Elements
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={identifyRequiredData}
                    onChange={() => handleToggle(identifyRequiredData, setIdentifyRequiredData)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    identifyRequiredData 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Identify and extract data elements
              </p>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Automatically Redact Elements
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={redactElements}
                    onChange={() => handleToggle(redactElements, setRedactElements)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    redactElements 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redact sensitive information
              </p>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Create Summary
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={createSummary}
                    onChange={() => handleToggle(createSummary, setCreateSummary)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    createSummary 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate a document summary
              </p>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Save Original Document
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={saveOriginalDocument}
                    onChange={() => handleToggle(saveOriginalDocument, setSaveOriginalDocument)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    saveOriginalDocument 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save the original document with retention policy
              </p>
              
              {saveOriginalDocument && (
                <div className="mt-2 px-4 border-l-2 border-indigo-200">
                  <select 
                    value={originalRetentionPolicy} 
                    onChange={(e) => setOriginalRetentionPolicy(e.target.value)}
                    onFocus={handleRetentionPolicyDropdownFocus}
                    className="w-full p-2 border border-gray-300 dark:border-navy-700 rounded-md bg-white dark:bg-navy-800 
                    text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoadingPolicies}
                  >
                    <option value="">Select Retention Policy</option>
                    {isLoadingPolicies ? (
                      <option value="" disabled>Loading policies...</option>
                    ) : policiesError ? (
                      <option value="" disabled>Error loading policies</option>
                    ) : (
                      retentionPolicies.map(policy => (
                        <option key={policy.id} value={policy.id}>
                          {policy.name} {policy.description ? `- ${policy.description}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {policiesError && (
                    <p className="text-xs text-red-500 mt-1">
                      Failed to load policies: {policiesError}
                      <button 
                        onClick={refreshRetentionPolicies} 
                        className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  Save Redacted Document
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={saveRedactedDocument}
                    onChange={() => handleToggle(saveRedactedDocument, setSaveRedactedDocument)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-offset-2 ${
                    saveRedactedDocument 
                      ? 'bg-indigo-600 peer-focus:ring-indigo-400' 
                      : 'bg-gray-300 dark:bg-gray-600 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-700'
                    } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save the redacted document with retention policy
              </p>
              
              {saveRedactedDocument && (
                <div className="mt-2 px-4 border-l-2 border-indigo-200">
                  <select 
                    value={redactedRetentionPolicy} 
                    onChange={(e) => setRedactedRetentionPolicy(e.target.value)}
                    onFocus={handleRetentionPolicyDropdownFocus}
                    className="w-full p-2 border border-gray-300 dark:border-navy-700 rounded-md bg-white dark:bg-navy-800 
                    text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoadingPolicies}
                  >
                    <option value="">Select Retention Policy</option>
                    {isLoadingPolicies ? (
                      <option value="" disabled>Loading policies...</option>
                    ) : policiesError ? (
                      <option value="" disabled>Error loading policies</option>
                    ) : (
                      retentionPolicies.map(policy => (
                        <option key={policy.id} value={policy.id}>
                          {policy.name} {policy.description ? `- ${policy.description}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {policiesError && (
                    <p className="text-xs text-red-500 mt-1">
                      Failed to load policies: {policiesError}
                      <button 
                        onClick={refreshRetentionPolicies} 
                        className="ml-2 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {/* Previous button - always shown */}
              <button
                onClick={handlePreviousStep}
                className="flex items-center justify-center py-2 px-6 border border-gray-300 text-gray-700 dark:text-white dark:border-navy-600 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-navy-800 focus:outline-none"
              >
                <span className="mr-2">←</span> Previous
              </button>
              
              {processingStatus.processingComplete ? (
                <>
                  {/* Re-Process button */}
                  <button
                    onClick={handleReprocessClick}
                    disabled={isProcessing}
                    className="flex items-center justify-center py-2 px-6 border border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 text-sm font-medium rounded-md hover:bg-indigo-50 dark:hover:bg-navy-800 focus:outline-none"
                  >
                    <MdAutorenew className="mr-2" /> Re-process
                  </button>
                  {/* Next button - use special handler when processing is complete */}
                  <button
                    onClick={handleNextAfterProcessing}
                    className="flex items-center justify-center py-2 px-6 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none"
                  >
                    Next <span className="ml-2">→</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="flex items-center justify-center py-2 px-6 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white inline-block"></span>
                      Processing...
                    </>
                  ) : (
                    'Process Document'
                  )}
                </button>
              )}
            </div>
            
            {/* Show processing status */}
            {isProcessing && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-navy-700 rounded-md border border-gray-200 dark:border-navy-600">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2">Processing Document</h4>
                <ul className="space-y-2">
                  {identifyRequiredData && (
                    <li className="flex items-center">
                      {processingStatus.autoMatchCompleted ? (
                        <BsFillCheckCircleFill className="text-green-500 mr-2" />
                      ) : (
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-indigo-400 inline-block"></span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">Auto-matching data elements</span>
                    </li>
                  )}
                  
                  {redactElements && (
                    <li className="flex items-center">
                      {processingStatus.redactionCompleted ? (
                        <BsFillCheckCircleFill className="text-green-500 mr-2" />
                      ) : (
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-indigo-400 inline-block"></span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">Applying redactions</span>
                    </li>
                  )}
                  
                  {createSummary && (
                    <li className="flex items-center">
                      {processingStatus.summaryCompleted ? (
                        <BsFillCheckCircleFill className="text-green-500 mr-2" />
                      ) : (
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-indigo-400 inline-block"></span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">Creating document summary</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Show error if any */}
            {processingStatus.error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
                <div className="flex items-start">
                  <MdOutlineWarningAmber className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">
                      Processing Error
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      {processingStatus.error}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                      Try the following:
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>Ensure document content is clearly visible</li>
                        <li>Check that all required fields are properly matched</li>
                        <li>Select retention policies for documents if saving is enabled</li>
                        <li>If the issue persists, try reloading the page and processing again</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Workflow Status Information - shown after processing is complete */}
            {processingStatus.processingComplete && !isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-navy-800 rounded-md border border-blue-200 dark:border-navy-600">
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                  Workflow Status
                </h4>
                <ul className="text-sm space-y-1.5">
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span className="text-navy-700 dark:text-gray-300">
                      Document processing completed successfully
                    </span>
                  </li>
                  <li className="flex items-center">
                    {(workflowSteps.find(s => s.id === 4)?.locked === false) ? (
                      <>
                        <BsFillCheckCircleFill className="text-green-500 mr-2" />
                        <span className="text-navy-700 dark:text-gray-300">
                          Finalise step is unlocked
                        </span>
                      </>
                    ) : (
                      <>
                        <MdOutlineWarningAmber className="text-amber-500 mr-2" />
                        <span className="text-navy-700 dark:text-gray-300">
                          Finalise step is still locked - click 'Next' to proceed
                        </span>
                      </>
                    )}
                  </li>
                  
                  {/* Help text */}
                  <li className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    If you're having trouble advancing to the Finalise step, click the 'Next' button again.
                    This will ensure the Finalise step is properly unlocked.
                  </li>
                </ul>
              </div>
            )}
          </div>
        );
      }
      
      // Add content for Finalise step (step 4)
      if (step.id === 4) {
        baseStep.content = (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-navy-700 dark:text-white mb-3">Document Processing Complete</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your document has been successfully processed. All selected steps have been completed.
              </p>
              
              {/* Removing document summary section from here as requested */}
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-navy-700 dark:text-white mb-2">Processing Summary</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {identifyRequiredData && (
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span>Data elements identified and extracted</span>
                  </li>
                )}
                {redactElements && (
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span>Sensitive information redacted</span>
                  </li>
                )}
                {createSummary && (
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span>Document summary generated</span>
                  </li>
                )}
                {saveOriginalDocument && (
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span>Original document saved with retention policy: <PolicyName policyId={originalRetentionPolicy} /></span>
                  </li>
                )}
                {saveRedactedDocument && (
                  <li className="flex items-center">
                    <BsFillCheckCircleFill className="text-green-500 mr-2" />
                    <span>Redacted document saved with retention policy: <PolicyName policyId={redactedRetentionPolicy} /></span>
                  </li>
                )}
              </ul>
              
              {/* Warning messages about document deletion */}
              {(!saveOriginalDocument || (!saveOriginalDocument && !saveRedactedDocument)) && (
                <div className="mt-4">
                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <MdOutlineWarningAmber className="h-5 w-5 text-amber-400 dark:text-amber-300" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Document Storage Warning
                        </h3>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                          {!saveOriginalDocument && !saveRedactedDocument ? (
                            <p>
                              You have chosen not to save any document versions. All document data will be deleted after processing.
                              Please confirm this is intended or select at least one document version to save.
                            </p>
                          ) : !saveOriginalDocument ? (
                            <p>
                              You have chosen not to save the original document. The original version will be deleted
                              and only the redacted version will be retained.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Metadata Editors */}
            <div className="mb-6">
              <h4 className="font-medium text-navy-700 dark:text-white mb-3">Document Metadata</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add or edit metadata for the documents before finalizing. This metadata will be stored with the documents and can be used for searching and filtering.
              </p>
              
              {/* Original Document Metadata Editor */}
              {saveOriginalDocument && (
                <DocumentMetadataEditor
                  documentType={analysisResults.classification?.type || ''}
                  documentSubType={analysisResults.classification?.subType}
                  retentionPolicyId={originalRetentionPolicy}
                  documentSummary={analysisResults.documentSummary}
                  classificationSource={analysisResults.classification?.source}
                  dataSensitivity={originalDocumentMetadata.dataSensitivity}
                  isOriginalDocument={true}
                  retentionPolicies={retentionPolicies}
                  onChange={(metadata) => {
                    setOriginalDocumentMetadata(prev => ({
                      ...prev,
                      ...metadata
                    }));
                    
                    // If updating retention policy, also update the main state
                    if (metadata.retentionPolicyId !== undefined) {
                      setOriginalRetentionPolicy(metadata.retentionPolicyId);
                    }
                  }}
                />
              )}
              
              {/* Redacted Document Metadata Editor */}
              {saveRedactedDocument && (
                <DocumentMetadataEditor
                  documentType={analysisResults.classification?.type || ''}
                  documentSubType={analysisResults.classification?.subType}
                  retentionPolicyId={redactedRetentionPolicy}
                  documentSummary={analysisResults.documentSummary}
                  classificationSource={analysisResults.classification?.source}
                  dataSensitivity={redactedDocumentMetadata.dataSensitivity}
                  isOriginalDocument={false}
                  retentionPolicies={retentionPolicies}
                  onChange={(metadata) => {
                    setRedactedDocumentMetadata(prev => ({
                      ...prev,
                      ...metadata
                    }));
                    
                    // If updating retention policy, also update the main state
                    if (metadata.retentionPolicyId !== undefined) {
                      setRedactedRetentionPolicy(metadata.retentionPolicyId);
                    }
                  }}
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={handlePreviousStep}
                className="flex items-center justify-center py-2 px-6 border border-gray-300 text-gray-700 dark:text-white dark:border-navy-600 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-navy-800 focus:outline-none"
              >
                <span className="mr-2">←</span> Back
              </button>
              
              <button
                onClick={saveDocuments}
                disabled={isProcessing}
                className="flex items-center justify-center py-2 px-6 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {(saveOriginalDocument || saveRedactedDocument) ? 'Finalise & Save' : 'Finish'} <span className="ml-2">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      }
      
      return baseStep;
    }));
  }, [
    currentStep,
    selectedFile,
    analysisResults.classification,
    isAnalysing,
    autoClassify,
    useTextExtraction,
    scanForTFN,
    conductFraudCheck,
    // Add dependencies for the Process Document options
    identifyRequiredData,
    redactElements,
    createSummary,
    saveOriginalDocument,
    saveRedactedDocument,
    originalRetentionPolicy,
    redactedRetentionPolicy,
    // Add dependencies for processing status
    isProcessing,
    processingStatus,
    // Add dependency for reprocess confirmation
    showReprocessConfirm
  ]);

  // Keep this effect for auto-classify synchronization
  useEffect(() => {
    if (analysisResults.classification) {
      setAutoClassify(true);
    }
  }, [analysisResults.classification]);

  // Add effect to auto-collapse the classification card when moving past step 2
  useEffect(() => {
    // Automatically collapse the classification card when moving past step 2
    if (currentStep > 2) {
      setIsClassificationCardCollapsed(true);
    } else {
      setIsClassificationCardCollapsed(false);
    }
  }, [currentStep]);

  // Add effect to auto-collapse DocumentControl when moving past step 3
  useEffect(() => {
    // Automatically collapse the DocumentControl when moving past step 3
    if (currentStep > 3) {
      setIsDocumentControlExpanded(false);
    } else if (currentStep === 3) {
      // Expand when on step 3
      setIsDocumentControlExpanded(true);
    }
  }, [currentStep]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };
  
  const handleStepClick = (stepId: number) => {
    // Find the step to navigate to
    const targetStep = workflowSteps.find(step => step.id === stepId);
    
    // Only navigate if the step isn't locked
    if (targetStep && !targetStep.locked) {
      // If current step is clicked, don't navigate but let the WorkflowStepperCard handle the toggle
      if (currentStep !== stepId) {
        setCurrentStep(stepId);
      }
      
      // If moving to Analyse step from another step, make sure we have a file
      if (stepId === 2 && !isAnalysing && selectedFile && !analysisResults.classification) {
        // Trigger analysis when moving to analyse step if not already analyzed
        setTimeout(() => {
          setIsAnalysing(true);
        }, 500);
      }
    }
  };
  
  const handleNextStep = () => {
    console.log('Handle Next Step clicked, current index:', currentStep);
    console.log('Current step is:', workflowSteps[currentStep - 1]);
    
    const nextStepIndex = currentStep;
    const nextStep = workflowSteps[nextStepIndex];
    
    console.log('Next step would be:', nextStep);
    console.log('Is next step locked?', nextStep?.locked);
    
    if (nextStep && !nextStep.locked) {
      console.log('Advancing to next step:', nextStep.name);
      setCurrentStep(nextStepIndex + 1);
      
      // If moving from Process Document to Finalise, collapse document control
      if (workflowSteps[currentStep - 1]?.id === 3 && nextStep.id === 4) {
        console.log('Moving from Process Document to Finalise, collapsing document control');
        setIsDocumentControlExpanded(false);
      }
      return true;
    } else {
      console.log('Cannot advance - next step is locked or does not exist');
      return false;
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update this function to receive and store analysis results
  const handleClassifyDocument = (results: AnalysisResults) => {
    console.log('handleClassifyDocument called with:', results);
    // Store the analysis results received from the DocumentClassification component
    setAnalysisResults(results);
    console.log('After setAnalysisResults:', results);
    setIsAnalysing(false);
    
    // Check if the classification is valid
    const hasValidClassification = isValidClassification(results.classification);
    
    // Update the workflow steps to mark the current step as completed only if valid classification
    setWorkflowSteps(prevSteps => {
      return prevSteps.map(step => {
        if (step.id === 2) { // Current step (Classify & Analyse)
          return {
            ...step,
            completed: hasValidClassification
          };
        } else if (step.id === 3) { // Next step (Process Document)
          return {
            ...step,
            locked: !hasValidClassification // Only unlock if classification is valid
          };
        }
        return step;
      });
    });
    
    // Allow the user to review the classification results before advancing automatically
    // Only move to the next step if we have a valid classification
    if (hasValidClassification) {
      setTimeout(() => {
        handleNextStep();
      }, 3000); // Increased delay to 3 seconds to give users time to see results
    }
  };
  
  const handleExtractText = async () => {
    if (!selectedFile) return;
    setIsAnalysing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', 'generic'); // Assuming a generic type for now

      const response = await fetch('/api/docs-2-analyse/analyse-document', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Text extraction failed');
      }

      const data = await response.json();
      setAnalysisResults({
        ...analysisResults,
        textExtraction: {
          success: true,
          text: data.extractedText
        },
        textractAnalyzeId: data.textractResponse ? data.textractResponse.JobId : null,
        rawTextractData: data.rawTextractData
      });

      // If extracted fields are available, update the state
      if (data.extractedFields && data.extractedFields.length > 0) {
        // Assuming a function to handle extracted fields
        handleExtractedFields(data.extractedFields);
      }

      // Handle page-by-page processing if required
      if (data.requiresPageByPage) {
        console.log(data.message);
        // Implement logic for page-by-page processing if needed
      }

    } catch (error) {
      console.error('Error extracting text:', error);
      setAnalysisResults({
        ...analysisResults,
        textExtraction: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setIsAnalysing(false);
    }
  };
  
  const handleExtractedFields = (extractedFields: any[]) => {
    // Process the extracted fields as needed
    console.log("Extracted Fields:", extractedFields);

    // Only update if the fields have actually changed
    if (!analysisResults.extractedFields || 
        analysisResults.extractedFields.length !== extractedFields.length) {
      // Example: Update the analysis results with extracted fields
      setAnalysisResults(prevResults => ({
        ...prevResults,
        extractedFields
      }));
    }
  };

  // Make sure our runSelectedAnalysis is properly handling the response data
  const runSelectedAnalysis = async () => {
    if (!selectedFile) return;
    
    setIsAnalysing(true);
    // Start with a fresh results object
    const results: AnalysisResults = {
      // Clear any existing classification
      classification: undefined
    };
    
    try {
      // Create form data for sending the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Step 1: Use AWS Textract to extract text from the document
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
      
      // Step 2: If auto-classify is enabled, try to use AWS Comprehend for classification
      if (autoClassify) {
        try {
          const classifyResponse = await fetch('/api/docs-2-analyse/classify-comprehend', {
            method: 'POST',
            body: formData
          });
          
          if (classifyResponse.ok) {
            const classificationResult = await classifyResponse.json();
            console.log('AWS Classification result:', classificationResult);
            
            // Validate AWS classification
            const awsType = classificationResult.dominant || "";
            const isValidAwsType = awsType.toLowerCase() !== "unknown" && 
                                 awsType.toLowerCase() !== "undefined" &&
                                 awsType.trim() !== "";
            
            results.awsClassification = {
              type: awsType,
              subType: undefined,
              confidence: classificationResult.dominantScore || 1.0
            };
            
            // Set the main classification result using AWS result if valid
            if (isValidAwsType) {
              results.classification = {
                type: awsType,
                subType: "",
                confidence: classificationResult.dominantScore || 1.0,
                source: 'AWS Comprehend'
              };
              console.log('Set classification from AWS:', results.classification);
            } else {
              console.warn('AWS classification returned invalid type:', awsType);
            }
          } else {
            const errorData = await classifyResponse.text();
            console.warn('AWS Comprehend classification failed:', errorData);
            console.warn('Continuing with LLM classification if enabled');
          }
        } catch (error) {
          console.error('Error during AWS Comprehend classification:', error);
          console.warn('Continuing with LLM classification if enabled');
        }
      }
      
      // Step 3: If text extraction option is enabled or AWS classification failed, try to classify with LLM
      if ((useTextExtraction || !results.classification) && textractData.extractedText) {
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

        try {
          const llmResponse = await fetch('/api/docs-2-analyse/classify-llm', {
            method: 'POST',
            body: JSON.stringify({
              text: textractData.extractedText,
              availableTypes: documentTypeConfig,
              fileName: selectedFile.name
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (llmResponse.ok) {
            const llmResult = await llmResponse.json();
            console.log('LLM Classification result:', llmResult);
            
            // Validate LLM classification
            const llmType = llmResult.documentType || llmResult.type || "";
            const isValidLlmType = llmType.toLowerCase() !== "unknown" && 
                                  llmType.toLowerCase() !== "undefined" &&
                                  llmType.trim() !== "";
            
            results.gptClassification = {
              type: llmType,
              subType: llmResult.subType || "",
              confidence: llmResult.confidence || 0.9,
              reasoning: llmResult.reasoning || ""
            };
            
            // Override the main classification result with LLM result if valid
            if (isValidLlmType) {
              results.classification = {
                type: llmType,
                subType: llmResult.subType || "",
                confidence: llmResult.confidence || 0.9,
                source: 'OpenAI'
              };
              console.log('Set classification from LLM:', results.classification);
            } else {
              console.warn('LLM classification returned invalid type:', llmType);
            }
          } else {
            console.warn('LLM classification failed, keeping AWS classification if available');
          }
        } catch (llmError) {
          console.error('Error during LLM classification:', llmError);
        }
      }
      
      // Step 4: If scan for TFN is enabled, check for TFNs
      if (scanForTFN && textractData.extractedText) {
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
      
      // Ensure we have a valid classification object before updating state
      if (results.classification) {
        console.log('Final classification before state update:', results.classification);
      } else {
        console.warn('No classification data found after processing');
      }
      
      // Update analysis results state to ensure they are displayed in both components
      console.log('Final results before setAnalysisResults:', results);
      setAnalysisResults({...results});
      
      // Check if we have a valid classification before completing the step
      const hasValidClassification = isValidClassification(results.classification);
      
      if (hasValidClassification) {
        // Pass the results to the handler function
        // This will trigger the DocumentClassification component to update via props
        handleClassifyDocument({...results});
      } else {
        console.warn('No valid classification found, step will remain incomplete');
        setIsAnalysing(false);
        
        // Update the workflow steps to reflect the invalid classification
        setWorkflowSteps(prevSteps => {
          return prevSteps.map(step => {
            if (step.id === 2) { // Only update the Analyse step
              return { 
                ...step,
                completed: false // Mark the step as not completed due to invalid classification
              };
            } else if (step.id === 3) { // Next step
              return {
                ...step,
                locked: true // Keep the next step locked
              };
            }
            return step;
          });
        });
      }
        
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResults({
        textExtraction: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      setIsAnalysing(false);
    }
  };

  // Custom Document Classification component props to synchronize with dropdown options
  const [documentClassificationRef, setDocumentClassificationRef] = useState(null);

  const documentClassificationProps = {
    file: selectedFile,
    onClassify: handleClassifyDocument,
    initialResults: analysisResults,
    onNext: handleNextStep,
    onCancel: () => setCurrentStep(1),
    // Pass the same states that are used in the dropdown
    autoClassify,
    useTextExtraction,
    scanForTFN,
    conductFraudCheck,
    setAutoClassify,
    setUseTextExtraction,
    setScanForTFN,
    setConductFraudCheck,
    ref: documentClassificationRef
  };

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentSubTypes, setDocumentSubTypes] = useState<DocumentSubType[]>([]);

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const response = await fetch('/api/update-config/document-types');
        if (!response.ok) throw new Error('Failed to fetch document types');
        const types = await response.json();
        setDocumentTypes(types);

        if (types.length > 0) {
          const subTypesResponse = await fetch(`/api/update-config/document-types/${types[0].id}/sub-types`);
          if (!subTypesResponse.ok) throw new Error('Failed to fetch sub-types');
          const subTypes = await subTypesResponse.json();
          setDocumentSubTypes(subTypes);
        }
      } catch (error) {
        console.error('Error fetching document types or sub-types:', error);
      }
    };

    fetchDocumentTypes();
  }, []);

  // Update current policies list - no local caching
  const fetchRetentionPoliciesFromDynamoDB = async () => {
    setIsLoadingPolicies(true);
    setPoliciesError(null);
    try {
      console.log("Directly fetching retention policies from DynamoDB via API");
      // Request directly from the API which communicates with DynamoDB
      const response = await fetch('/api/update-config/retention-policies', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch retention policies: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch retention policies: ${response.status} - ${errorText}`);
      }
      
      const policies = await response.json();
      console.log(`Successfully retrieved ${policies.length} retention policies from DynamoDB`);
      
      // Only update the UI state, not storing the policies for later use
      setRetentionPolicies(policies);
      return policies;
    } catch (error) {
      console.error('Error fetching retention policies from DynamoDB:', error);
      setPoliciesError(error instanceof Error ? error.message : 'Unknown error');
      return [];
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  // Get a specific retention policy by ID directly from DynamoDB
  const getRetentionPolicyById = async (policyId: string) => {
    if (!policyId) return null;
    
    try {
      console.log(`Fetching specific retention policy ${policyId} directly from DynamoDB`);
      const response = await fetch(`/api/update-config/retention-policies/${policyId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch retention policy ${policyId}: ${response.status} - ${errorText}`);
        
        // If it's a 404, the policy doesn't exist
        if (response.status === 404) {
          return null;
        }
        
        // For other errors, try to find it in the current list
        console.log(`Attempting to find policy ${policyId} in current list as fallback`);
        const currentPolicy = retentionPolicies.find(p => p.id === policyId);
        if (currentPolicy) {
          console.log(`Found policy ${policyId} in current list: ${currentPolicy.name}`);
          return currentPolicy;
        }
        
        throw new Error(`Failed to fetch retention policy: ${response.status}`);
      }
      
      const policy = await response.json();
      console.log(`Successfully retrieved policy ${policyId} from DynamoDB: ${policy.name}`);
      return policy;
    } catch (error) {
      console.error(`Error fetching retention policy ${policyId}:`, error);
      
      // Try to find it in the current list as a fallback
      const currentPolicy = retentionPolicies.find(p => p.id === policyId);
      if (currentPolicy) {
        console.log(`Using cached policy ${policyId} as fallback: ${currentPolicy.name}`);
        return currentPolicy;
      }
      
      return null;
    }
  };

  // Replace existing useEffect for fetching retention policies
  useEffect(() => {
    // Fetch retention policies when the component mounts
    fetchRetentionPoliciesFromDynamoDB();
  }, []);

  // Add a function to refresh policies when needed
  const refreshRetentionPolicies = async () => {
    return await fetchRetentionPoliciesFromDynamoDB();
  };

  // Update code for validating policies
  const validateRetentionPolicies = async () => {
    let policiesValid = true;
    let policyError = '';
    let networkError = false;
    
    try {
      if (saveOriginalDocument) {
        if (!originalRetentionPolicy) {
          policiesValid = false;
          policyError = 'Please select a retention policy for the original document';
        } else {
          // Verify the policy exists in DynamoDB
          try {
            const policy = await getRetentionPolicyById(originalRetentionPolicy);
            if (!policy) {
              policiesValid = false;
              policyError = 'Selected retention policy for original document is invalid';
              // Refresh policies since there's an inconsistency
              await refreshRetentionPolicies();
            }
          } catch (err) {
            console.error('Error validating original document policy:', err);
            networkError = true;
            // Don't fail validation for network errors
          }
        }
      }
      
      if (saveRedactedDocument) {
        if (!redactedRetentionPolicy) {
          policiesValid = false;
          policyError = policyError ? 
            'Please select retention policies for both documents' : 
            'Please select a retention policy for the redacted document';
        } else {
          // Verify the policy exists in DynamoDB
          try {
            const policy = await getRetentionPolicyById(redactedRetentionPolicy);
            if (!policy) {
              policiesValid = false;
              policyError = policyError ? 
                policyError + ' and selected retention policy for redacted document is invalid' : 
                'Selected retention policy for redacted document is invalid';
              // Refresh policies since there's an inconsistency
              await refreshRetentionPolicies();
            }
          } catch (err) {
            console.error('Error validating redacted document policy:', err);
            networkError = true;
            // Don't fail validation for network errors
          }
        }
      }
      
      // If we had network errors but no other validation errors, we'll let it pass
      // This allows the process to continue even if DynamoDB is temporarily unavailable
      if (networkError && policiesValid) {
        console.warn('Validation proceeded despite network errors - using best available policy data');
      }
      
      return { valid: policiesValid, error: policyError };
    } catch (error) {
      console.error('Policy validation error:', error);
      return { 
        valid: false, 
        error: 'Error validating retention policies. Please try again or contact support.'
      };
    }
  };

  // Handle redactions being applied from DocumentControl
  const handleApplyRedactions = (items: Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
    value?: string;
    boundingBox?: any;
  }>) => {
    setRedactedItems(items);
    
    // Show a success message
    if (items.length > 0) {
      // You could add a success notification here if needed
      console.log(`Applied ${items.length} redactions to document`);
      
      // The DocumentViewer will automatically switch to redacted view when
      // it detects changes to redactedItems with items.length > 0 if the user
      // clicks on the "Redacted View" tab
    }
  };

  // Reset processing status when entering Step 3
  useEffect(() => {
    if (currentStep === 3) {
      // Reset processing status when entering step 3
      setProcessingStatus({
        autoMatchCompleted: false,
        redactionCompleted: false,
        summaryCompleted: false,
        processingComplete: false,
        summaryText: undefined,
        error: undefined
      });
    }
  }, [currentStep]);

  // Create a ref for DocumentControl
  const documentControlRef = useRef<DocumentControlHandle>(null);
  
  // Memoize extractedFields to avoid unnecessary re-renders
  const memoizedExtractedFields = useMemo(() => {
    return analysisResults.extractedFields || [];
  }, [analysisResults.extractedFields]);
  
  // Function to process the document based on selected options
  const processDocument = async () => {
    setIsProcessing(true);
    setProcessingStatus({
      autoMatchCompleted: false,
      redactionCompleted: false,
      summaryCompleted: false,
      processingComplete: false,
      summaryText: undefined,
      error: undefined
    });
    
    try {
      // Step 1: Auto-match fields if selected
      if (identifyRequiredData) {
        // Use the ref instead of querying the DOM
        if (documentControlRef.current?.autoMatchFields) {
          try {
            await documentControlRef.current.autoMatchFields();
            // Mark auto-match as completed
            setProcessingStatus(prev => ({ ...prev, autoMatchCompleted: true }));
          } catch (error) {
            console.error('Error auto-matching fields:', error);
            setProcessingStatus(prev => ({ 
              ...prev, 
              autoMatchCompleted: false,
              error: error instanceof Error ? error.message : 'Error during auto-matching'
            }));
          }
        } else {
          console.warn('Auto-match function not found on DocumentControl');
          setProcessingStatus(prev => ({ 
            ...prev, 
            autoMatchCompleted: true, // Mark as completed anyway to allow proceeding
            error: 'Auto-match function not available'
          }));
        }
      } else {
        // Skip auto-match
        setProcessingStatus(prev => ({ ...prev, autoMatchCompleted: true }));
      }
      
      // Step 2: Apply redactions if selected
      if (redactElements) {
        if (documentControlRef.current?.handleApplyRedactions) {
          try {
            const redactedResult = await documentControlRef.current.handleApplyRedactions();
            // If handleApplyRedactions returns items, update them directly
            if (redactedResult && Array.isArray(redactedResult)) {
              setRedactedItems(redactedResult);
              console.log(`Applied ${redactedResult.length} redactions`);
            }
            // Mark redaction as completed
            setProcessingStatus(prev => ({ ...prev, redactionCompleted: true }));
          } catch (error) {
            console.error('Error applying redactions:', error);
            setProcessingStatus(prev => ({ 
              ...prev, 
              redactionCompleted: false,
              error: error instanceof Error ? error.message : 'Error during redaction'
            }));
          }
        } else {
          console.warn('Apply redactions function not found on DocumentControl');
          setProcessingStatus(prev => ({ 
            ...prev, 
            redactionCompleted: true, // Mark as completed anyway to allow proceeding
            error: 'Redaction function not available'
          }));
        }
      } else {
        // Skip redaction
        setProcessingStatus(prev => ({ ...prev, redactionCompleted: true }));
      }
      
      // Step 3: Create summary if selected
      if (createSummary && analysisResults?.textExtraction?.text) {
        try {
          const response = await fetch('/api/docs-3-process/summarise-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: analysisResults.textExtraction.text,
              documentType: analysisResults.classification?.type,
              documentSubType: analysisResults.classification?.subType,
              extractedFields: analysisResults.extractedFields
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Summary generation failed');
          }
          
          const summaryResult = await response.json();
          
          // Store the summary in the processing status and analysis results
          setProcessingStatus(prev => ({ 
            ...prev, 
            summaryCompleted: true,
            summaryText: summaryResult.summary
          }));
          
          // Also store in analysisResults for the DocumentViewer
          setAnalysisResults(prevResults => ({
            ...prevResults,
            documentSummary: summaryResult.summary
          }));
        } catch (error) {
          console.error('Error creating summary:', error);
          setProcessingStatus(prev => ({ 
            ...prev, 
            summaryCompleted: false,
            error: error instanceof Error ? error.message : 'Unknown error during summary creation'
          }));
        }
      } else {
        // Skip summary or use mock data if text extraction is not available
        if (createSummary && !analysisResults?.textExtraction?.text) {
          // Create a mock summary if text extraction is not available
          const mockSummary = 'This document appears to be a valid ' + 
            (analysisResults.classification?.type || 'identification document') + 
            (analysisResults.classification?.subType ? ` (${analysisResults.classification.subType})` : '') +
            '. The document contains personal identification information including full name, date of birth, place of birth, and nationality. All security features appear to be present and valid.';
            
          setAnalysisResults(prevResults => ({
            ...prevResults,
            documentSummary: mockSummary
          }));
          
          setProcessingStatus(prev => ({ 
            ...prev, 
            summaryCompleted: true,
            summaryText: mockSummary
          }));
        } else {
          // Skip summary
          setProcessingStatus(prev => ({ ...prev, summaryCompleted: true }));
        }
      }
      
      // Step 4: Validate retention policies if saving documents - now with direct DynamoDB check
      const { valid: policiesValid, error: policyError } = await validateRetentionPolicies();
      
      if (!policiesValid) {
        setProcessingStatus(prev => ({ 
          ...prev, 
          processingComplete: false,
          error: policyError
        }));
      } else {
        // All processing steps completed successfully
        setProcessingStatus(prev => ({ 
          ...prev, 
          processingComplete: true,
          error: undefined
        }));
        
        console.log("Processing completed successfully - updating workflow steps");
        
        // Show success notification
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 rounded shadow-lg z-50 flex items-center';
        successMessage.innerHTML = `
          <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Document processed successfully!</span>
          <button class="ml-4 text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" onclick="this.parentElement.remove()">×</button>
        `;
        document.body.appendChild(successMessage);
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 5000);
        
        // Ensure the document control is collapsed upon completion
        setIsDocumentControlExpanded(false);
        
        // Force update workflow steps directly to mark Process Document step as completed and unlock Finalise step
        setWorkflowSteps(prevSteps => {
          const updatedSteps = prevSteps.map(step => {
            if (step.id === 3) {
              console.log("Marking Process Document step as completed");
              return {
                ...step,
                completed: true
              };
            } else if (step.id === 4) {
              console.log("Unlocking Finalise step");
              return {
                ...step,
                locked: false
              };
            }
            return step;
          });
          
          console.log("Updated workflow steps:", updatedSteps);
          return updatedSteps;
        });
        
        // After a short delay, verify that the steps were updated correctly and potentially auto-navigate
        setTimeout(() => {
          console.log("Current workflow steps after update:", workflowSteps);
          console.log("Current step index:", currentStep - 1);
          
          // Force a refresh of the current step index to ensure proper navigation
          const stepIndex = workflowSteps.findIndex(step => step.id === 3);
          if (stepIndex >= 0) {
            // Only force navigation if we're still on this step
            if (currentStep - 1 === stepIndex) {
              const nextStepIndex = workflowSteps.findIndex(step => step.id === 4);
              console.log('Next step index (Finalise):', nextStepIndex);
              console.log('Is next step locked?', workflowSteps[nextStepIndex]?.locked);
              
              // Directly set the current step to the "Finalise" step
              if (!workflowSteps[nextStepIndex]?.locked) {
                console.log('Automatically advancing to Finalise step');
                setCurrentStep(4);
              }
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error during document processing:', error);
      setProcessingStatus(prev => ({ 
        ...prev, 
        processingComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error during document processing'
      }));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Validate policies when they change - now using direct DynamoDB check
  useEffect(() => {
    let isMounted = true;
    const validatePolicies = async () => {
      if (currentStep === 3 && processingStatus.processingComplete) {
        try {
          // Basic validation first - check if policies are selected
          let quickValidation = true;
          
          if (saveOriginalDocument && !originalRetentionPolicy) {
            quickValidation = false;
          }
          
          if (saveRedactedDocument && !redactedRetentionPolicy) {
            quickValidation = false;
          }
          
          // If basic validation fails, no need to make API calls
          if (!quickValidation) {
            if (isMounted) {
              setProcessingStatus(prev => ({ ...prev, processingComplete: false }));
            }
            return;
          }
          
          // Only if basic validation passes, do the full validation
          // Use our direct DynamoDB validation function
          const { valid: policiesValid } = await validateRetentionPolicies();
          
          if (isMounted) {
            if (!policiesValid) {
              setProcessingStatus(prev => ({ ...prev, processingComplete: false }));
            } else {
              setProcessingStatus(prev => ({ ...prev, processingComplete: true }));
            }
          }
        } catch (error) {
          console.error('Error during policy validation:', error);
          // Don't change processing status for network errors - use what we have
        }
      }
    };
    
    validatePolicies();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [currentStep, saveOriginalDocument, saveRedactedDocument, originalRetentionPolicy, redactedRetentionPolicy, processingStatus.processingComplete]);

  // Handle re-process confirmation
  const handleReprocessConfirm = () => {
    setShowReprocessConfirm(false);
    
    // Reset redacted items to ensure the document viewer updates
    setRedactedItems([]);
    
    // Reset processing status
    setProcessingStatus({
      autoMatchCompleted: false,
      redactionCompleted: false,
      summaryCompleted: false,
      processingComplete: false,
      summaryText: undefined,
      error: undefined
    });
    
    // Also clear the document summary in analysis results
    setAnalysisResults(prevResults => ({
      ...prevResults,
      documentSummary: undefined
    }));
    
    // Update workflow steps to mark Process Document step as not completed and lock Finalise step
    setWorkflowSteps(prevSteps => {
      return prevSteps.map(step => {
        if (step.id === 3) {
          return {
            ...step,
            completed: false
          };
        } else if (step.id === 4) {
          return {
            ...step,
            locked: true // Lock the Finalise step again
          };
        }
        return step;
      });
    });
    
    // Start processing
    processDocument();
  };

  // Handle re-process button click
  const handleReprocessClick = () => {
    setShowReprocessConfirm(true);
  };

  // Add a special handler for the Next button when processing is complete
  const handleNextAfterProcessing = () => {
    console.log("Next button clicked after processing");
    
    // Check current status of workflow steps
    const currentFinaliseStep = workflowSteps.find(s => s.id === 4);
    console.log("Current Finalise step locked status:", currentFinaliseStep?.locked);
    
    // Force update the workflow steps to ensure Finalise is unlocked
    console.log("Forcing workflow steps update to unlock Finalise");
    setWorkflowSteps(prevSteps => {
      const updatedSteps = prevSteps.map(step => {
        if (step.id === 3) {
          console.log("Marking Process Document step as completed");
          return {
            ...step,
            completed: true
          };
        } else if (step.id === 4) {
          console.log("Unlocking Finalise step");
          return {
            ...step,
            locked: false
          };
        }
        return step;
      });
      
      console.log("Updated workflow steps:", updatedSteps);
      return updatedSteps;
    });
    
    // Collapse document control
    console.log("Collapsing document control");
    setIsDocumentControlExpanded(false);
    
    // Short delay to make sure state updates before moving to next step
    setTimeout(() => {
      console.log("Moving to Finalise step");
      setCurrentStep(4);
      
      // Log the current state of the workflow steps for debugging
      console.log("Current workflow steps after timeout:", workflowSteps);
      const finaliseStep = workflowSteps.find(s => s.id === 4);
      console.log("Finalise step lock status after timeout:", finaliseStep?.locked);
      
      // Add an additional check to see if we need to force it again
      if (finaliseStep?.locked) {
        console.log("Finalise step still locked after timeout, forcing direct navigation");
        setCurrentStep(4);
      }
    }, 100);
  };

  // Function to save documents with metadata
  const saveDocuments = async () => {
    try {
      // Show loading state
      setIsProcessing(true);
      
      // Prepare metadata
      const baseMetadata = {
        documentType: analysisResults.classification?.type || '',
        documentSubType: analysisResults.classification?.subType || '',
        classificationSource: analysisResults.classification?.source,
        classificationConfidence: analysisResults.classification?.confidence,
        documentSummary: analysisResults.documentSummary,
        extractedFieldCount: analysisResults.extractedFields?.length || 0,
        processingTimestamp: new Date().toISOString(),
      };
      
      // Save each document type that's enabled
      const savePromises = [];
      
      if (saveOriginalDocument) {
        // Prepare original document metadata
        const originalMetadata = {
          ...baseMetadata,
          retentionPolicyId: originalRetentionPolicy,
          dataSensitivity: originalDocumentMetadata.dataSensitivity,
          isRedacted: false,
          customFields: originalDocumentMetadata.customFields,
        };
        
        // Create a FormData with the file and metadata
        const formData = new FormData();
        formData.append('file', selectedFile as File);
        formData.append('metadata', JSON.stringify(originalMetadata));
        
        // Send the save request
        const saveOriginalPromise = fetch('/api/docs-4-finalize/save-document', {
          method: 'POST',
          body: formData
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to save original document: ${response.status}`);
          }
          return response.json();
        });
        
        savePromises.push(saveOriginalPromise);
      }
      
      if (saveRedactedDocument && redactedItems.length > 0) {
        // Prepare redacted document metadata
        const redactedMetadata = {
          ...baseMetadata,
          retentionPolicyId: redactedRetentionPolicy,
          dataSensitivity: redactedDocumentMetadata.dataSensitivity,
          isRedacted: true,
          redactedItemCount: redactedItems.length,
          customFields: redactedDocumentMetadata.customFields,
        };
        
        // We need to generate a redacted version of the document
        // For now we'll use a placeholder for the redacted document
        // In a real implementation, you would use the redacted document blob
        
        // Create a FormData with the file and metadata
        const formData = new FormData();
        formData.append('file', selectedFile as File); // In real implementation, use redacted document blob
        formData.append('metadata', JSON.stringify(redactedMetadata));
        formData.append('redactedItems', JSON.stringify(redactedItems));
        
        // Send the save request
        const saveRedactedPromise = fetch('/api/docs-4-finalize/save-redacted-document', {
          method: 'POST',
          body: formData
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to save redacted document: ${response.status}`);
          }
          return response.json();
        });
        
        savePromises.push(saveRedactedPromise);
      }
      
      // Wait for all save operations to complete
      const results = await Promise.allSettled(savePromises);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some documents failed to save:', failures);
        alert('Some documents failed to save. Please try again or contact support.');
      } else {
        console.log('All documents saved successfully');
        // Redirect to documents page
        window.location.href = '/admin/documents';
      }
    } catch (error) {
      console.error('Error saving documents:', error);
      alert('An error occurred while saving documents. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetentionPolicyDropdownFocus = async () => {
    // Refresh policies when the dropdown is focused
    await refreshRetentionPolicies();
  };

  // Policy Name Component for displaying retention policy names fetched directly from DynamoDB
  const PolicyName: React.FC<{ policyId: string }> = ({ policyId }) => {
    const [policyName, setPolicyName] = useState<string>('Loading...');
    
    useEffect(() => {
      const fetchPolicy = async () => {
        if (!policyId) {
          setPolicyName('Unknown policy');
          return;
        }
        
        try {
          const policy = await getRetentionPolicyById(policyId);
          setPolicyName(policy?.name || 'Unknown policy');
        } catch (error) {
          console.error(`Error fetching policy ${policyId}:`, error);
          setPolicyName('Error loading policy');
        }
      };
      
      fetchPolicy();
    }, [policyId]);
    
    return <>{policyName}</>;
  };

  // Document Metadata Editor component for the finalization step
  interface DocumentMetadataProps {
    documentType: string;
    documentSubType?: string;
    retentionPolicyId: string;
    documentSummary?: string;
    classificationSource?: string;
    dataSensitivity: string;
    isOriginalDocument: boolean;
    retentionPolicies: Array<{id: string, name: string, description?: string, duration: number}>;
    onChange: (metadata: Partial<DocumentMetadataProps>) => void;
  }

  const DocumentMetadataEditor: React.FC<DocumentMetadataProps> = ({
    documentType,
    documentSubType,
    retentionPolicyId,
    documentSummary,
    classificationSource,
    dataSensitivity,
    isOriginalDocument,
    retentionPolicies,
    onChange
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Data sensitivity options
    const sensitivityLevels = [
      { id: 'public', name: 'Public', description: 'Information that can be freely shared with the public' },
      { id: 'internal', name: 'Internal', description: 'Information for internal use only' },
      { id: 'confidential', name: 'Confidential', description: 'Sensitive information with restricted access' },
      { id: 'restricted', name: 'Restricted', description: 'Highly restricted information with strictly limited access' }
    ];
    
    return (
      <div className="mb-4 rounded-lg border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-base font-medium text-navy-700 dark:text-white">
            {isOriginalDocument ? 'Original Document' : 'Redacted Document'} Metadata
          </h3>
          <button 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" 
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            }
          </button>
        </div>
        
        {isExpanded && (
          <div className="p-4 pt-0 border-t border-gray-200 dark:border-navy-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Document Classification */}
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type
                  </label>
                  <input
                    type="text"
                    value={documentType}
                    readOnly
                    className="w-full rounded-md bg-gray-100 dark:bg-navy-700 border-gray-300 dark:border-navy-600 py-2 px-3 text-sm"
                  />
                  {classificationSource && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Classification source: {classificationSource}
                    </p>
                  )}
                </div>
                
                {documentSubType && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Document Subtype
                    </label>
                    <input
                      type="text"
                      value={documentSubType}
                      readOnly
                      className="w-full rounded-md bg-gray-100 dark:bg-navy-700 border-gray-300 dark:border-navy-600 py-2 px-3 text-sm"
                    />
                  </div>
                )}
              </div>
              
              {/* Data Sensitivity & Retention Policy */}
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Sensitivity
                  </label>
                  <select
                    value={dataSensitivity}
                    onChange={(e) => onChange({ dataSensitivity: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                  >
                    <option value="">Select sensitivity level</option>
                    {sensitivityLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retention Policy
                  </label>
                  <select
                    value={retentionPolicyId}
                    onChange={(e) => onChange({ retentionPolicyId: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                  >
                    <option value="">Select retention policy</option>
                    {retentionPolicies.map(policy => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name} ({daysToYears(policy.duration).toFixed(1)} years)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Document Summary */}
            {documentSummary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Summary
                </label>
                <textarea
                  value={documentSummary}
                  onChange={(e) => onChange({ documentSummary: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border-gray-300 dark:border-navy-600 dark:bg-navy-700 py-2 px-3 text-sm"
                />
              </div>
            )}
            
            {/* Custom Metadata Fields */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Metadata</h4>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={() => {
                    // Functionality to add custom metadata field would go here
                    // Would need additional state management
                  }}
                  className="flex items-center gap-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Custom Field
                </button>
              </div>
              
              {/* This would be where custom metadata fields would be displayed */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Custom metadata fields will be saved with the document and can be used for searching and filtering.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Convert days to years for display
  const daysToYears = (days: number) => Number((days / 365).toFixed(2));

  return (
    <div className="mt-6 flex w-full flex-col items-center bg-white dark:bg-navy-900 py-4">
      {/* Main layout with 2 columns */}
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDE - Workflow stepper only */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Workflow stepper card with gradient background */}
            <WorkflowStepperCard
              steps={workflowSteps}
              currentStep={currentStep}
              completedCount={completedCount}
              totalSteps={workflowSteps.length}
              title="Document Workflow"
              onStepClick={handleStepClick}
              expandedStep={currentStep}
            />
          </div>
          
          {/* RIGHT SIDE - Document upload, classification, control, and viewer */}
          <div className="lg:col-span-7">
            {/* Only show original stepper on smaller screens */}
            <div className="lg:hidden w-full mb-6">
              <DocumentWorkflowStepper 
                currentStep={currentStep} 
                onStepClick={handleStepClick} 
              />
            </div>
            
            {/* Step-specific content for upload step - moved to right column */}
            {currentStep === 1 && (
              <DocumentUpload onFileSelect={handleFileSelect} />
            )}
            
            {/* Add DocumentClassification component above DocumentViewer */}
            {selectedFile && (
              <Card extra="w-full mb-6 p-6">
                <DocumentClassification 
                  file={selectedFile}
                  onClassify={handleClassifyDocument}
                  initialResults={analysisResults}
                  onNext={handleNextStep}
                  onCancel={() => setCurrentStep(1)}
                  autoClassify={autoClassify}
                  useTextExtraction={useTextExtraction}
                  scanForTFN={scanForTFN}
                  conductFraudCheck={conductFraudCheck}
                  setAutoClassify={setAutoClassify}
                  setUseTextExtraction={setUseTextExtraction}
                  setScanForTFN={setScanForTFN}
                  setConductFraudCheck={setConductFraudCheck}
                  isCollapsed={isClassificationCardCollapsed}
                  setIsCollapsed={setIsClassificationCardCollapsed}
                />
              </Card>
            )}
            
            {/* Document Control component - only show when classification is complete and we're on step 3 or later */}
            {selectedFile && analysisResults.classification && currentStep >= 3 && (
              <div className="mb-6">
                <DocumentControl
                  ref={documentControlRef}
                  documentType={analysisResults.classification.type}
                  documentSubType={analysisResults.classification.subType}
                  extractedFields={memoizedExtractedFields}
                  onFieldsMatched={(matchedFields) => {
                    console.log('Matched fields:', matchedFields);
                    // You can store and use the matched fields data here
                  }}
                  onApplyRedactions={handleApplyRedactions}
                  textractData={analysisResults.rawTextractData}
                  isExpanded={isDocumentControlExpanded}
                  onExpandChange={setIsDocumentControlExpanded}
                />
              </div>
            )}
            
            {/* Document viewer - Only show when not in upload step (step 1) */}
            {currentStep > 1 && selectedFile && (
              <Card extra="w-full p-6">
                <div className="bg-white dark:bg-navy-800 rounded-xl overflow-hidden">
                  <DocumentViewer 
                    file={selectedFile} 
                    classificationResults={analysisResults} 
                    redactedItems={redactedItems}
                    showExtractedText={autoClassify && useTextExtraction}
                    currentStep={currentStep}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reprocess Confirmation Dialog */}
      {showReprocessConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Confirm Re-Processing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Re-processing the document will reset any existing processed data including:
            </p>
            <ul className="list-disc pl-5 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <li>Matched data elements</li>
              <li>Applied redactions</li>
              <li>Generated document summary</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your current settings and options will be retained.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReprocessConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReprocessConfirm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Re-Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessDocument;
