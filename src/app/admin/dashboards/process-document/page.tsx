'use client';
import { useState, useEffect, useRef } from 'react';
import DocumentUpload from '@/components/admin/dashboards/process-document/DocumentUpload';
import DocumentViewer from '@/components/admin/dashboards/process-document/DocumentViewer';
import DocumentWorkflowStepper from '@/components/admin/dashboards/process-document/DocumentWorkflowStepper';
import DocumentClassification from '@/components/admin/dashboards/process-document/DocumentClassification';
import Card from '@/components/card';
import WorkflowStepperCard from '@/components/admin/dashboards/process-document/WorkflowStepperCard';
import { 
  MdCloudUpload, 
  MdSearch, 
  MdAutorenew, 
  MdCheckCircle,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdWarning
} from 'react-icons/md';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { MdError } from 'react-icons/md';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';

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

const ProcessDocument = () => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [activeDataTab, setActiveDataTab] = useState<'extractedText' | 'awsResponse'>('extractedText');
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
  const [isClassificationCardExpanded, setIsClassificationCardExpanded] = useState(true);
  
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
        completed: step.id < currentStep || (step.id === 2 && !!analysisResults.classification),
        locked: step.id === 1 
          ? false 
          : step.id === 2 
            ? !selectedFile 
            : step.id === 3 
              ? !analysisResults.classification 
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
          <div className="p-4 rounded-lg">
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
                Extract text and use LLM data analysis
              </p>
            </div>
            
            <div>
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
                  <>{analysisResults.classification ? 'Reanalyse Document' : 'Analyse Document'}</>
                )}
              </button>
              
              {analysisResults.classification && (
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
      
      return baseStep;
    }));
  }, [
    currentStep,
    selectedFile,
    analysisResults.classification,
    isAnalysing,
    autoClassify,
    useTextExtraction,
    scanForTFN
  ]);

  // Keep this effect for auto-classify synchronization
  useEffect(() => {
    if (analysisResults.classification) {
      setAutoClassify(true);
    }
  }, [analysisResults.classification]);

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
    if (currentStep < 4) {
      const nextStep = workflowSteps.find(step => step.id === currentStep + 1);
      if (nextStep && !nextStep.locked) {
        setCurrentStep(currentStep + 1);
      }
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
    
    // Update the workflow steps to mark the current step as completed
    setWorkflowSteps(prevSteps => {
      return prevSteps.map(step => {
        if (step.id === 2) { // Current step (Classify & Analyse)
          return {
            ...step,
            completed: true
          };
        } else if (step.id === 3) { // Next step (Process Document)
          return {
            ...step,
            locked: false // Unlock the next step
          };
        }
        return step;
      });
    });
    
    // Allow the user to review the classification results before advancing automatically
    // Move to the next step (Process) after a longer delay
    setTimeout(() => {
      handleNextStep();
    }, 3000); // Increased delay to 3 seconds to give users time to see results
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

    // Example: Update the analysis results with extracted fields
    setAnalysisResults(prevResults => ({
      ...prevResults,
      extractedFields
    }));

    // You can add more logic here to handle the extracted fields
    // For example, you might want to map them to specific UI components
    // or store them in a different state variable for further processing
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
      
      // Step 2: If auto-classify is enabled, use AWS Comprehend for classification
      if (autoClassify) {
        const classifyResponse = await fetch('/api/docs-2-analyse/classify-comprehend', {
          method: 'POST',
          body: formData
        });
        
        if (!classifyResponse.ok) {
          const errorData = await classifyResponse.json();
          throw new Error(errorData.error || 'Classification failed');
        }
        
        const classificationResult = await classifyResponse.json();
        console.log('AWS Classification result:', classificationResult);
        results.awsClassification = {
          type: classificationResult.dominant,
          subType: undefined,
          confidence: classificationResult.dominantScore || 1.0
        };
        
        // Set the main classification result using AWS result
        results.classification = {
          type: classificationResult.dominant,
          subType: "",
          confidence: classificationResult.dominantScore || 1.0,
          source: 'AWS Comprehend'
        };
        console.log('Set classification from AWS:', results.classification);
      }
      
      // Step 3: If text extraction option is enabled, try to classify with LLM
      if (useTextExtraction && textractData.extractedText) {
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
            fileName: selectedFile.name
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (llmResponse.ok) {
          const llmResult = await llmResponse.json();
          console.log('LLM Classification result:', llmResult);
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
          console.log('Set classification from LLM:', results.classification);
        } else {
          console.warn('LLM classification failed, keeping AWS classification if available');
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
      
      // Pass the results to the handler function
      // This will trigger the DocumentClassification component to update via props
      handleClassifyDocument({...results});
      
      // Force a re-render of all components by explicitly updating the state
      // This ensures both the workflow step content and DocumentClassification card are updated
      setWorkflowSteps(prevSteps => {
        // Create a fresh copy of all steps to trigger a re-render
        return prevSteps.map(step => {
          if (step.id === 2) { // Only update the Analyse step
            // Recreate the step object to force React to re-render it
            return { 
              ...step,
              completed: true // Mark the step as completed
            };
          } else if (step.id === 3) { // Next step
            return {
              ...step,
              locked: false // Unlock the next step
            };
          }
          return step;
        });
      });
        
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
    setAutoClassify,
    setUseTextExtraction,
    setScanForTFN,
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

  return (
    <div className="mt-6 flex w-full flex-col items-center bg-white dark:bg-navy-900 py-4">
      {/* Main layout with 2 columns */}
      <div className="w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDE - Workflow stepper and step-specific content */}
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
            
            {/* Step-specific content for upload step */}
            {currentStep === 1 && (
              <DocumentUpload onFileSelect={handleFileSelect} />
            )}
          </div>
          
          {/* RIGHT SIDE - Document viewer */}
          <div className="lg:col-span-7">
            {/* Only show original stepper on smaller screens */}
            <div className="lg:hidden w-full mb-6">
              <DocumentWorkflowStepper 
                currentStep={currentStep} 
                onStepClick={handleStepClick} 
              />
            </div>
            
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
                  setAutoClassify={setAutoClassify}
                  setUseTextExtraction={setUseTextExtraction}
                  setScanForTFN={setScanForTFN}
                />
              </Card>
            )}
            
            {/* Document viewer - This is the only place where the document viewer should be */}
            <Card extra="w-full p-6">
              <h3 className="text-xl font-bold mb-4 text-navy-700 dark:text-white">Document Viewer</h3>
              <div className="bg-white dark:bg-navy-800 rounded-xl overflow-hidden">
                <DocumentViewer 
                  file={selectedFile} 
                  classificationResults={analysisResults} 
                  showExtractedText={currentStep > 2}
                  showTitle={false}
                  currentStep={currentStep}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDocument;
