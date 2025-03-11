import Card from '@/components/card';
import { MdDescription, MdError, MdContentCopy, MdWarning } from 'react-icons/md';
import { BsFillCheckCircleFill, BsCheckCircle } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';


interface DocumentViewerProps {
  file?: File;
  classificationResults?: {
    classification?: { type: string; subType: string; confidence: number; source: string };
    awsClassification?: { type: string; subType?: string; confidence: number };
    gptClassification?: { type: string; subType: string; confidence: number; reasoning?: string };
    textExtraction?: { success: boolean; text?: string; error?: string; mock?: boolean };
    tfnDetection?: { detected: boolean; count?: number; error?: string; mock?: boolean };
    textractAnalyzeId?: string;
    extractedFields?: any[];
    rawTextractData?: any;
    sentiment?: string;
    sentimentScores?: { [key: string]: number };
    languageCode?: string;
  };
  showExtractedText?: boolean;
  showTitle?: boolean;
  currentStep?: number;
}

const DocumentViewer = ({ 
  file, 
  classificationResults, 
  showExtractedText,
  showTitle = true,
  currentStep
}: DocumentViewerProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'extracted'>('original');
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'elements' | 'comprehend' | 'textract'>('text');
  const [copySuccess, setCopySuccess] = useState(false);
  const previewRef = useRef<{ url: string | null; fileName: string | null }>({ url: null, fileName: null });
  
  // Reset to original document tab when file changes
  useEffect(() => {
    setActiveTab('original');
  }, [file]);

  // Also reset to original document tab when workflow step changes
  useEffect(() => {
    if (currentStep) {
      setActiveTab('original');
    }
  }, [currentStep]);

  // Cleanup effect for preview URL
  useEffect(() => {
    return () => {
      if (previewRef.current.url) {
        URL.revokeObjectURL(previewRef.current.url);
      }
    };
  }, []);

  // Handle preview URL creation and cleanup
  useEffect(() => {
    if (!file) {
      return;
    }

    // Only create a new preview URL if the file has changed
    if (!preview || previewRef.current.fileName !== file.name) {
      // Cleanup previous URL if it exists
      if (previewRef.current.url) {
        URL.revokeObjectURL(previewRef.current.url);
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      previewRef.current = {
        url: objectUrl,
        fileName: file.name
      };
    }

    // Check file type
    setIsImage(file.type.startsWith('image/'));
    setIsPdf(file.type === 'application/pdf');
  }, [file]);

  // Determine if the file format is supported
  const isFormatSupported = file && (isImage || isPdf);

  const getFileSize = () => {
    if (!file) return '';
    return `${Math.round(file.size / 1024)} KB`;
  };
  
  const getShortFileType = (mimeType: string) => {
    if (!mimeType) return '';
    
    if (mimeType.startsWith('image/')) {
      return mimeType.replace('image/', '').toUpperCase();
    } else if (mimeType === 'application/pdf') {
      return 'PDF';
    } else {
      return mimeType.split('/').pop()?.toUpperCase() || mimeType;
    }
  };

  // Get classification confidence text and color
  const getConfidenceDisplay = (confidence: number) => {
    const confidencePercent = Math.round(confidence * 100);
    let textColor = 'text-green-600 dark:text-green-500';
    
    if (confidencePercent < 70) {
      textColor = 'text-red-600 dark:text-red-500';
    } else if (confidencePercent < 90) {
      textColor = 'text-amber-600 dark:text-amber-500';
    }
    
    return {
      text: `${confidencePercent}% Confidence`,
      color: textColor
    };
  };

  const handleCopyText = async () => {
    if (classificationResults?.textExtraction?.text) {
      try {
        await navigator.clipboard.writeText(classificationResults.textExtraction.text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  return (
    <div className="w-full h-full">
      {/* File info header */}
      <div className="">
        {showTitle && <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Document Viewer</h2>}
      </div>
      
      {/* Main tabs */}
      <div className="my-4">
        <div className="flex w-full justify-start gap-8 overflow-hidden">
          <div
            onClick={() => setActiveTab('original')}
            className={
              activeTab === 'original'
                ? 'flex items-center gap-3 border-b-[4px] border-brand-500 pb-3 hover:cursor-pointer dark:border-brand-400'
                : 'flex items-center gap-3 border-b-[4px] border-white pb-3 hover:cursor-pointer dark:!border-navy-800'
            }
          >
            <p className="text-md font-semi-bold text-navy-700 dark:text-white">
              Original Document
            </p>
          </div>
          <div
            onClick={() => setActiveTab('extracted')}
            className={
              activeTab === 'extracted'
                ? 'flex items-center gap-3 border-b-[4px] border-brand-500 pb-3 hover:cursor-pointer dark:border-brand-400'
                : 'flex items-center gap-3 border-b-[4px] border-white pb-3 hover:cursor-pointer dark:!border-navy-800'
            }
          >
            <p className="text-md font-semi-bold text-navy-700 dark:text-white">
              Extracted Data
            </p>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'original' && (
            <div className="h-full">
              {file && (
                <div className="flex-1 flex flex-col">
                  {/* Document preview */}
                  <div className="flex-1 mt-8 min-h-[400px] overflow-hidden rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800">
                    {!preview ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                          Preview not available for this file type
                        </p>
                      </div>
                    ) : isImage ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                          src={preview} 
                          alt="Document preview" 
                          className="max-w-full max-h-[400px] object-contain mx-auto"
                          key={`${file.name}-${preview}`}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.complete && target.src.startsWith('blob:')) {
                              // Don't revoke the URL here as we need it for the preview
                              // It will be cleaned up when the file changes or component unmounts
                              console.log('Image loaded successfully');
                            }
                          }}
                        />
                      </div>
                    ) : isPdf ? (
                      <iframe 
                        src={`${preview}#toolbar=0&navpanes=0`} 
                        className="w-full h-full"
                        title="PDF preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                          Preview not available for this file type
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!file && (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 mb-6">
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#94a3b8"/>
                      <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#94a3b8"/>
                    </svg>
                  </div>
                  <p className="text-center font-medium text-gray-500 dark:text-gray-400">
                    Upload a document to see the preview here
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'extracted' && (
            <div className="flex flex-col h-full">
              {/* Sub-tabs as full-width buttons */}
              <div className="mt-4 grid grid-cols-4 gap-2 p-4">
                <button
                  onClick={() => setActiveSubTab('text')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeSubTab === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-600'
                  }`}
                >
                  Extracted Text
                </button>
                <button
                  onClick={() => setActiveSubTab('elements')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeSubTab === 'elements'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-600'
                  }`}
                >
                  Data Elements
                </button>
                <button
                  onClick={() => setActiveSubTab('comprehend')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeSubTab === 'comprehend'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-600'
                  }`}
                >
                  AWS Comprehend
                </button>
                <button
                  onClick={() => setActiveSubTab('textract')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeSubTab === 'textract'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-600'
                  }`}
                >
                  AWS Textract
                </button>
              </div>

              {/* Sub-tab content */}
              <div className="flex-1 overflow-hidden px-4">
                {activeSubTab === 'text' && (
                  <div className="relative">
                    <button
                      onClick={handleCopyText}
                      className="absolute right-2 top-2 p-2 rounded-md bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors duration-200 z-10"
                      title="Copy text"
                    >
                      {copySuccess ? (
                        <span className="h-5 w-5 text-green-500">
                          <BsCheckCircle />
                        </span>
                      ) : (
                        <span className="h-5 w-5 text-gray-500 dark:text-gray-400">
                          <MdContentCopy />
                        </span>
                      )}
                    </button>
                    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
                      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 scrollbar-track-transparent">
                        <pre className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {classificationResults?.textExtraction?.text || 'No extracted text available'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'elements' && (
                  <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 scrollbar-track-transparent space-y-4">
                      {classificationResults?.extractedFields?.map((field, index) => (
                        <div key={index} className="bg-white dark:bg-navy-700 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{field.label || field.id}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Confidence: {(field.confidence * 100).toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{field.value || field.text}</p>
                        </div>
                      )) || (
                        <div className="text-gray-500 dark:text-gray-400">
                          No extracted data elements available
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSubTab === 'comprehend' && (
                  <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 scrollbar-track-transparent">
                      <pre className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify({
                          dominant: classificationResults?.awsClassification?.type,
                          confidence: classificationResults?.awsClassification?.confidence,
                          sentiment: classificationResults?.sentiment,
                          sentimentScores: classificationResults?.sentimentScores,
                          languageCode: classificationResults?.languageCode
                        }, null, 2) || 'No AWS Comprehend response available'}
                      </pre>
                    </div>
                  </div>
                )}

                {activeSubTab === 'textract' && (
                  <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-4">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 scrollbar-track-transparent">
                      <pre className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {classificationResults?.rawTextractData
                          ? JSON.stringify(classificationResults.rawTextractData, null, 2)
                          : 'No AWS Textract response available'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 