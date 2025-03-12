import Card from '@/components/card';
import { MdDescription, MdError, MdContentCopy, MdWarning, MdHideImage } from 'react-icons/md';
import { BsFillCheckCircleFill, BsCheckCircle } from 'react-icons/bs';
import { useState, useEffect, useRef } from 'react';
import ClickablePillLabel from '@/components/admin/main/others/pill-labels/ClickablePillLabel';

interface RedactedItem {
  id: string;
  type: 'element' | 'field';
  name: string;
  value?: string;
  boundingBox?: any;
}

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
  redactedItems?: RedactedItem[];
  onApplyRedactions?: (redactedItems: RedactedItem[]) => void;
  showExtractedText?: boolean;
  showTitle?: boolean;
  currentStep?: number;
}

const DocumentViewer = ({ 
  file, 
  classificationResults, 
  redactedItems = [],
  showExtractedText,
  showTitle = true,
  currentStep
}: DocumentViewerProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'extracted' | 'redacted'>('original');
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'elements' | 'comprehend' | 'textract'>('text');
  const [copySuccess, setCopySuccess] = useState(false);
  const previewRef = useRef<{ url: string | null; fileName: string | null }>({ url: null, fileName: null });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [redactedImage, setRedactedImage] = useState<string | null>(null);
  
  // Reset to original document tab when file changes
  useEffect(() => {
    setActiveTab('original');
    setRedactedImage(null);
  }, [file]);

  // Also reset to original document tab when workflow step changes
  useEffect(() => {
    if (currentStep) {
      setActiveTab('original');
    }
  }, [currentStep]);

  // Reset redacted image when redactedItems changes
  useEffect(() => {
    setRedactedImage(null);
    
    // Automatically switch to redacted view when redactions are applied
    if (redactedItems.length > 0) {
      setActiveTab('redacted');
    }
  }, [redactedItems]);

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

  // Apply redactions when activeTab changes to 'redacted'
  useEffect(() => {
    if (activeTab === 'redacted' && isImage && preview && !redactedImage && redactedItems.length > 0) {
      applyRedactionsToImage();
    }
  }, [activeTab, isImage, preview, redactedItems, redactedImage]);

  // Determine if the file format is supported
  const isFormatSupported = file && (isImage || isPdf);

  // Handle applying redactions to the image
  const applyRedactionsToImage = async () => {
    if (!isImage || !preview || !canvasRef.current || redactedItems.length === 0) return;
    
    console.log("Starting redaction process with items:", redactedItems);
    
    try {
      // Create a new image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Use a promise to wait for the image to load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Set image dimensions for scaling
          setImageDimensions({
            width: img.width,
            height: img.height
          });
          
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
          
          // Get bounding boxes from Textract data
          const textractBoxes = getBoundingBoxesFromTextract();
          console.log("Textract boxes:", textractBoxes);
          
          let redactionCount = 0;
          
          // Apply redactions
          redactedItems.forEach(item => {
            console.log(`Processing redaction for: ${item.name} (${item.type})`);
            
            // Check for directly provided bounding box
            if (item.boundingBox) {
              console.log("Using provided bounding box:", item.boundingBox);
              applyBoundingBoxRedaction(ctx, canvas.width, canvas.height, item.boundingBox);
              redactionCount++;
              return;
            }
            
            // Check if we have a value to search for in Textract data
            if (item.value) {
              console.log(`Searching for exact match: "${item.value}"`);
              const boxes = textractBoxes[item.value] || [];
              
              if (boxes.length > 0) {
                console.log(`Found ${boxes.length} exact matches for "${item.value}"`);
                // Apply redactions for each occurrence
                boxes.forEach(box => {
                  applyBoundingBoxRedaction(ctx, canvas.width, canvas.height, box);
                  redactionCount++;
                });
                return;
              }
              
              // If no exact match, try partial matches
              console.log("No exact match found, trying partial matches");
              let partialMatches = [];
              
              // Try to find partial matches in Textract blocks
              Object.entries(textractBoxes).forEach(([text, boxes]) => {
                // Check if item.value is contained within text or vice versa
                if (
                  (text.toLowerCase().includes(item.value.toLowerCase()) || 
                   item.value.toLowerCase().includes(text.toLowerCase()))
                ) {
                  partialMatches.push(...boxes);
                  console.log(`Found partial match: "${text}" contains or is contained in "${item.value}"`);
                }
              });
              
              if (partialMatches.length > 0) {
                console.log(`Applying redaction to ${partialMatches.length} partial matches`);
                partialMatches.forEach(box => {
                  applyBoundingBoxRedaction(ctx, canvas.width, canvas.height, box);
                  redactionCount++;
                });
                return;
              }
            }
            
            // If we're here, try to use item.name as a fallback
            if (item.name) {
              console.log(`Trying fallback with item name: "${item.name}"`);
              const nameBoxes = textractBoxes[item.name] || [];
              
              if (nameBoxes.length > 0) {
                console.log(`Found ${nameBoxes.length} matches for name "${item.name}"`);
                nameBoxes.forEach(box => {
                  applyBoundingBoxRedaction(ctx, canvas.width, canvas.height, box);
                  redactionCount++;
                });
                return;
              }
              
              // Try name partial matches
              console.log("No exact match for name, trying partial matches");
              let namePartialMatches = [];
              
              Object.entries(textractBoxes).forEach(([text, boxes]) => {
                if (
                  (text.toLowerCase().includes(item.name.toLowerCase()) || 
                   item.name.toLowerCase().includes(text.toLowerCase()))
                ) {
                  namePartialMatches.push(...boxes);
                  console.log(`Found partial match for name: "${text}" contains or is contained in "${item.name}"`);
                }
              });
              
              if (namePartialMatches.length > 0) {
                console.log(`Applying redaction to ${namePartialMatches.length} partial name matches`);
                namePartialMatches.forEach(box => {
                  applyBoundingBoxRedaction(ctx, canvas.width, canvas.height, box);
                  redactionCount++;
                });
                return;
              }
            }
            
            console.log(`WARN: Could not find any matches for item: ${item.name}`);
          });
          
          console.log(`Applied a total of ${redactionCount} redactions`);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          setRedactedImage(dataUrl);
          
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
  
  // Helper function to apply a redaction using a bounding box
  const applyBoundingBoxRedaction = (
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number, 
    box: any
  ) => {
    // Calculate the position and size
    const x = box.Left * canvasWidth;
    const y = box.Top * canvasHeight;
    const width = box.Width * canvasWidth;
    const height = box.Height * canvasHeight;
    
    // Add some padding to ensure we cover the text fully
    const padding = Math.max(2, height * 0.1); // At least 2px or 10% of height
    
    // Draw a black rectangle over the text
    ctx.fillStyle = 'black';
    ctx.fillRect(
      Math.max(0, x - padding), 
      Math.max(0, y - padding), 
      width + (padding * 2), 
      height + (padding * 2)
    );
  };

  // Get bounding boxes from Textract data with improved extraction
  const getBoundingBoxesFromTextract = (): Record<string, any[]> => {
    if (!classificationResults?.rawTextractData) {
      console.log("No Textract data available");
      return {};
    }
    
    const textractData = classificationResults.rawTextractData;
    const boundingBoxes: Record<string, any[]> = {};
    
    try {
      // Extract blocks from Textract data
      const blocks = textractData.Blocks || [];
      console.log(`Processing ${blocks.length} Textract blocks`);
      
      // Process each block
      blocks.forEach((block: any) => {
        if ((block.BlockType === 'LINE' || block.BlockType === 'WORD' || block.BlockType === 'KEY_VALUE_SET') && 
            block.Text && 
            block.Geometry?.BoundingBox) {
          
          const text = block.Text.trim();
          const geometry = block.Geometry;
          const boundingBox = geometry.BoundingBox;
          
          // Only store blocks with valid text and bounding boxes
          if (text && boundingBox.Width && boundingBox.Height) {
            if (!boundingBoxes[text]) {
              boundingBoxes[text] = [];
            }
            boundingBoxes[text].push(boundingBox);
            
            // Also store lowercase version to aid matching
            const lowerText = text.toLowerCase();
            if (lowerText !== text) {
              if (!boundingBoxes[lowerText]) {
                boundingBoxes[lowerText] = [];
              }
              boundingBoxes[lowerText].push(boundingBox);
            }
          }
        }
      });
      
      console.log(`Extracted ${Object.keys(boundingBoxes).length} unique text items with bounding boxes`);
    } catch (error) {
      console.error('Error processing Textract data:', error);
    }
    
    return boundingBoxes;
  };

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
          <div
            onClick={() => {
              if (redactedItems.length > 0) {
                setActiveTab('redacted')
              }
            }}
            className={
              activeTab === 'redacted'
                ? 'flex items-center gap-3 border-b-[4px] border-brand-500 pb-3 hover:cursor-pointer dark:border-brand-400'
                : `flex items-center gap-3 border-b-[4px] border-white pb-3 hover:cursor-pointer dark:!border-navy-800 ${
                    redactedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`
            }
          >
            <p className="text-md font-semi-bold text-navy-700 dark:text-white flex items-center">
              <MdHideImage className="mr-2" /> Redacted View
              {redactedItems.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                  {redactedItems.length}
                </span>
              )}
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
                          ref={imageRef}
                          src={preview} 
                          alt="Document preview" 
                          className="max-w-full max-h-[400px] object-contain mx-auto"
                          key={`${file.name}-${preview}`}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.complete && target.src.startsWith('blob:')) {
                              // Don't revoke the URL here as we need it for the preview
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
                  <div className="p-4">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 scrollbar-track-transparent space-y-4 pr-6">
                      {classificationResults?.extractedFields?.map((field, index) => (
                        <div key={index} className="bg-white dark:bg-navy-700 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{field.label || field.id}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Confidence: {((field.confidence * 100) / 100).toFixed(1)}%
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

          {activeTab === 'redacted' && (
            <div className="h-full">
              {file && (
                <div className="flex-1 flex flex-col">
                  {/* Redacted document preview */}
                  <div className="flex-1 mt-8 min-h-[400px] overflow-hidden rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800">
                    {redactedItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <MdHideImage className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                          No redactions have been applied
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                          Select elements for redaction and click "Apply Redactions" to view the redacted document
                        </p>
                      </div>
                    ) : !isImage ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <MdHideImage className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                          Redaction is currently only supported for images
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                          PDF redaction will be available in a future update
                        </p>
                      </div>
                    ) : redactedImage ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                          src={redactedImage}
                          alt="Redacted document" 
                          className="max-w-full max-h-[400px] object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="inline-flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400">
                            Applying redactions...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Information about redactions */}
                  {redactedItems.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-navy-700 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Redacted Elements ({redactedItems.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {redactedItems.map((item, index) => (
                          <span 
                            key={`${item.id}-${index}`} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!file && (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 mb-6">
                    <MdHideImage className="w-full h-full text-gray-300" />
                  </div>
                  <p className="text-center font-medium text-gray-500 dark:text-gray-400">
                    Upload a document to apply redactions
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Canvas for redaction processing - hidden */}
      <canvas 
        ref={canvasRef} 
        className="hidden"
        width={imageDimensions?.width || 1} 
        height={imageDimensions?.height || 1}
      />
    </div>
  );
};

export default DocumentViewer; 