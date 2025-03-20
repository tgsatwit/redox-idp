'use client';

import { useState, useRef, useEffect } from 'react';
import { MdCloudUpload, MdCreditCard, MdCheck, MdInfo, MdWarning, MdClose, MdContentCopy } from 'react-icons/md';
import Card from '@/components/card';

// Define interfaces for data structures
interface TextBlock {
  id: string;
  text: string;
  type: string;
  confidence?: number;
  geometry?: {
    BoundingBox?: {
      Width: number;
      Height: number;
      Left: number;
      Top: number;
    };
  };
  page?: number;
}

interface CreditCardResult {
  original: string;
  redacted: string;
  groups?: string[];
  lastFourDigits?: string;
  blocks: Array<{
    id: string;
    text: string;
    geometry?: {
      BoundingBox?: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
      };
    };
    groupInfo?: {
      isFirstTwelve: boolean;
      text: string;
    };
    page?: number;
  }>;
}

interface ProcessingResults {
  creditCardFound?: boolean;
  creditCardCount?: number;
  results?: CreditCardResult[];
  textBlocks?: TextBlock[];
  redactedImage?: string | null;
  error?: string;
  pdfRedactionReport?: {
    filename: string;
    detectedCards: number;
    redactionInfo: {
      cardNumber: string;
      redactedNumber: string;
      pagesFound: number[];
      lastFourDigits: string;
    }[];
  };
}

const CreditCardProcessingPage = () => {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedacting, setIsRedacting] = useState(false);
  const [processingResults, setProcessingResults] = useState<ProcessingResults>({});
  
  // Document redaction options
  const [saveRedactedVersion, setSaveRedactedVersion] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // UI state
  const [securityInfoOpen, setSecurityInfoOpen] = useState(false);

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
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle processing the document for credit card detection
  const processDocument = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/docs-2-analyse/detect-credit-card', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Processing results:', data);
      
      setProcessingResults({
        creditCardFound: data.creditCardFound,
        creditCardCount: data.creditCardCount,
        results: data.results,
        textBlocks: data.textBlocks
      });
      
      // If credit card found and it's an image, prepare for redaction
      if (data.creditCardFound && isImage) {
        await applyRedactions(data.results);
      } else if (data.creditCardFound && isPdf) {
        // For PDFs, we'll generate a redaction report instead of visual redaction
        generatePdfRedactionReport(data.results);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingResults({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Apply redactions to the document (works for images)
  const applyRedactions = async (creditCardResults: CreditCardResult[] = []) => {
    if (!isImage || !preview || !canvasRef.current || !creditCardResults?.length) {
      console.log("Cannot apply redactions: missing requirements", { isImage, hasPreview: !!preview, hasCanvas: !!canvasRef.current, resultsLength: creditCardResults?.length });
      return;
    }
    
    console.log("Starting redaction process with results:", creditCardResults);
    setIsRedacting(true);
    
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
          console.log("Image drawn to canvas, dimensions:", {width: canvas.width, height: canvas.height});
          
          // Apply redactions to each credit card number found
          let redactionApplied = false;
          
          creditCardResults.forEach(result => {
            console.log("Processing credit card result:", result);
            
            // Extract last 4 digits to ensure we never redact them
            const lastFourDigits = result.lastFourDigits || result.original.slice(-4);
            console.log("Last four digits to preserve:", lastFourDigits);
            
            // First, check if all the digits are in one continuous block (typical for OCR on credit cards)
            const fullCardBlock = result.blocks.find(block => {
              // Find a block containing all or most of the credit card digits
              const blockDigits = block.text.replace(/\D/g, '');
              return blockDigits.length >= 12 && result.original.includes(blockDigits);
            });
            
            if (fullCardBlock && fullCardBlock.geometry?.BoundingBox) {
              // For a full card in a single block, redact *only* the first 12 digits (75% from left)
              console.log("Found full card in a single block, applying partial redaction");
              
              const bbox = fullCardBlock.geometry.BoundingBox;
              // Calculate actual pixel positions from relative coordinates
              const x = bbox.Left * canvas.width;
              const y = bbox.Top * canvas.height;
              const width = bbox.Width * canvas.width;
              const height = bbox.Height * canvas.height;
              
              // Only redact the first 75% (12/16 digits) - this is crucial
              const redactWidth = width * 0.75;
              
              // Draw a black rectangle over the first 12 digits only
              ctx.fillStyle = 'black';
              ctx.fillRect(x, y, redactWidth, height);
              
              // Add asterisks to indicate redaction
              ctx.fillStyle = 'white';
              const fontSize = Math.min(height * 0.7, 14);
              ctx.font = `${fontSize}px Arial`;
              ctx.fillText("************", x + 5, y + height / 2 + fontSize / 3);
              
              redactionApplied = true;
              return; // Skip other methods if we've already applied redaction
            }
            
            // If we have separate blocks for digits, redact only blocks with the first 12 digits
            // IMPORTANT: We need to make sure we're not redacting blocks with the last 4 digits
            const blocksToRedact = result.blocks.filter(block => {
              // Check if this block contains ONLY the last 4 digits
              const blockText = block.text;
              const containsLastFourOnly = blockText.includes(lastFourDigits) && 
                                          !result.groups?.slice(0, -1).some(group => blockText.includes(group));
              
              // Skip blocks that specifically contain ONLY the last 4 digits
              return !containsLastFourOnly;
            });
            
            console.log(`Redacting ${blocksToRedact.length} blocks for this card, preserving last 4 digits`);
            
            // For multi-block scenarios, we need to determine which blocks correspond to which parts of the card
            // We'll analyze the blocks to find those containing the last 4 digits vs the first 12
            const blockAnalysis = blocksToRedact.map(block => {
              const blockText = block.text;
              const containsLastFour = blockText.includes(lastFourDigits);
              
              // If a block contains the last 4 digits and other parts, we need to calculate
              // how much of the block to redact (parts before the last 4 digits)
              if (containsLastFour) {
                // Find the position of the last 4 digits
                const lastFourIndex = blockText.indexOf(lastFourDigits);
                const shouldRedactPartial = lastFourIndex > 0;
                
                return { 
                  block, 
                  containsLastFour, 
                  shouldRedactPartial,
                  lastFourIndex
                };
              }
              
              // This block doesn't contain the last 4 digits, so redact fully
              return { block, containsLastFour: false, shouldRedactPartial: false };
            });
            
            // Process each block based on our analysis
            blockAnalysis.forEach(analysis => {
              const { block, containsLastFour, shouldRedactPartial, lastFourIndex } = analysis;
              
              if (!block.geometry?.BoundingBox) return;
              
              const bbox = block.geometry.BoundingBox;
              const x = bbox.Left * canvas.width;
              const y = bbox.Top * canvas.height;
              const width = bbox.Width * canvas.width;
              const height = bbox.Height * canvas.height;
              
              // If this block contains the last 4 digits and other content before it
              if (containsLastFour && shouldRedactPartial && lastFourIndex !== undefined) {
                // Calculate approximately what percentage of the block to redact
                // based on where the last 4 digits start
                const blockText = block.text;
                const redactRatio = lastFourIndex / blockText.length;
                const redactWidth = width * redactRatio;
                
                console.log(`Partially redacting block: "${blockText}" at (${x}, ${y}) - redacting first ${redactRatio.toFixed(2)}% to preserve last 4 digits`);
                
                // Redact only the portion before the last 4 digits
                ctx.fillStyle = 'black';
                ctx.fillRect(x, y, redactWidth, height);
                
                // Add asterisks
                ctx.fillStyle = 'white';
                const fontSize = Math.min(height * 0.7, 14);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText("****", x + 5, y + height / 2 + fontSize / 3);
              } 
              // If the block doesn't contain the last 4 digits at all, redact it completely
              else if (!containsLastFour) {
                console.log(`Fully redacting block: "${block.text}" at (${x}, ${y}) with size ${width}x${height}`);
                
                // Draw a black rectangle over this part
                ctx.fillStyle = 'black';
                ctx.fillRect(x, y, width, height);
                
                // Add asterisks to indicate redaction
                ctx.fillStyle = 'white';
                const fontSize = Math.min(height * 0.7, 14);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText("****", x + 5, y + height / 2 + fontSize / 3);
              }
              // Skip blocks that only contain the last 4 digits
              else {
                console.log(`Preserving block with last 4 digits: "${block.text}" at (${x}, ${y})`);
              }
              
              redactionApplied = true;
            });
          });
          
          // Fallback if no redaction was applied but we have results
          if (!redactionApplied && creditCardResults.length > 0) {
            console.log("No redaction was applied using normal methods, using global fallback");
            
            // Find all blocks with geometry to determine the general area
            const allBlocks = creditCardResults.flatMap(result => result.blocks);
            const blocksWithGeometry = allBlocks.filter(block => block.geometry?.BoundingBox);
            
            if (blocksWithGeometry.length > 0) {
              // Calculate average position of all blocks
              let totalLeft = 0;
              let totalTop = 0;
              let totalWidth = 0;
              let totalHeight = 0;
              
              blocksWithGeometry.forEach(block => {
                const bbox = block.geometry?.BoundingBox;
                if (bbox) {
                  totalLeft += bbox.Left;
                  totalTop += bbox.Top;
                  totalWidth += bbox.Width;
                  totalHeight += bbox.Height;
                }
              });
              
              const avgLeft = totalLeft / blocksWithGeometry.length;
              const avgTop = totalTop / blocksWithGeometry.length;
              const avgWidth = (totalWidth / blocksWithGeometry.length) * 2.5; // Wider to cover multiple digits, but not all
              const avgHeight = totalHeight / blocksWithGeometry.length;
              
              // Apply redaction to the average area - only 75% of the width to preserve last 4 digits
              ctx.fillStyle = 'black';
              ctx.fillRect(
                avgLeft * canvas.width, 
                avgTop * canvas.height, 
                avgWidth * canvas.width * 0.75, // Only redact 75% to leave last 4 digits
                avgHeight * canvas.height
              );
              
              // Add text
              ctx.fillStyle = 'white';
              ctx.font = '14px Arial';
              ctx.fillText("************", 
                (avgLeft * canvas.width) + 5, 
                (avgTop * canvas.height) + (avgHeight * canvas.height) / 2 + 5
              );
            } else {
              // Final fallback if we can't determine position - modify to only cover part of the image
              // Don't cover the entire image - instead, add a semi-transparent banner
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(0, 0, canvas.width * 0.75, canvas.height * 0.2); // Only cover 75% width
              ctx.fillStyle = 'white';
              ctx.font = '20px Arial';
              ctx.fillText("Credit Card First 12 Digits Redacted", canvas.width * 0.05, canvas.height * 0.1);
            }
          }
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          console.log("Redaction complete, setting result image");
          setProcessingResults(prev => ({
            ...prev,
            redactedImage: dataUrl
          }));
          
          resolve();
        };
        
        img.onerror = (err) => {
          console.error("Image loading error:", err);
          reject(new Error('Failed to load image'));
        };
        
        img.src = preview;
      });
    } catch (error) {
      console.error('Error applying redactions:', error);
    } finally {
      setIsRedacting(false);
    }
  };
  
  // Generate a PDF redaction report for PDFs (since we can't modify them directly)
  const generatePdfRedactionReport = (creditCardResults: CreditCardResult[] = []) => {
    if (!creditCardResults.length) return;
    
    // Create a report object that can be displayed
    const reportData = {
      filename: selectedFile?.name || 'document.pdf',
      detectedCards: creditCardResults.length,
      redactionInfo: creditCardResults.map((result, index) => ({
        cardNumber: result.original,
        redactedNumber: result.redacted,
        pagesFound: Array.from(new Set(result.blocks.map(b => b.page || 1))),
        lastFourDigits: result.lastFourDigits || result.original.slice(-4)
      }))
    };
    
    // Set the report in the processing results
    setProcessingResults(prev => ({
      ...prev,
      pdfRedactionReport: reportData
    }));
  };
  
  // Save PDF redaction report as JSON file
  const savePdfRedactionReport = () => {
    if (!processingResults.pdfRedactionReport) return;
    
    const reportData = processingResults.pdfRedactionReport;
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `redaction-report-${selectedFile?.name || 'document'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Save the redacted image
  const saveRedactedImage = () => {
    if (!processingResults.redactedImage) return;
    
    const link = document.createElement('a');
    link.href = processingResults.redactedImage;
    link.download = `redacted-${selectedFile?.name || 'image.png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Copy redacted credit card to clipboard
  const copyRedactedText = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Redacted card number copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
      });
  };
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-navy-900 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Document upload and preview */}
        <div className="flex flex-col gap-6">
          {/* Document upload section */}
          <Card extra="w-full p-6 bg-navy-800 border-none">
            <h2 className="text-lg font-semibold text-white mb-4">Upload Document</h2>
            
            {!selectedFile ? (
              <div
                className={`flex h-60 cursor-pointer items-center justify-center rounded-xl border border-dashed ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-gray-700 bg-navy-900'
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
                  <p className="text-base font-medium text-gray-300">
                    Drop your document here, or <span className="text-indigo-500">click to browse</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supported formats: PDF, JPEG, PNG, TIFF
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col rounded-lg border border-navy-700 bg-navy-900 p-4">
                  {preview && (
                    <div className="flex items-center justify-center p-4 bg-navy-900 rounded-lg h-[300px]">
                      <img 
                        ref={imageRef}
                        src={preview}
                        alt="Document preview" 
                        className="max-w-full max-h-[280px] object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Document Uploaded</p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs text-gray-400">
                          {selectedFile.name}
                        </p>
                        <span className="text-xs text-gray-500">•</span>
                        <p className="text-xs text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Ready to process
                      </p>
                    </div>
                  </div>
                  <button 
                    className="rounded-md bg-red-900/20 p-2 text-red-400 hover:bg-red-900/30 h-fit"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setProcessingResults({});
                    }}
                  >
                    <MdClose className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Security compliance dropdown */}
                <div className="mt-4">
                  <button 
                    onClick={() => setSecurityInfoOpen(!securityInfoOpen)}
                    className="w-full flex justify-between items-center rounded-md bg-navy-700 p-3 text-white hover:bg-navy-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <MdInfo className="h-5 w-5 text-blue-400 mr-2" />
                      <span>Security Compliance Information</span>
                    </div>
                    <div className={`transform transition-transform ${securityInfoOpen ? 'rotate-180' : ''}`}>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.41 0.590088L6 5.17009L10.59 0.590088L12 2.00009L6 8.00009L0 2.00009L1.41 0.590088Z" fill="#A0AEC0"/>
                      </svg>
                    </div>
                  </button>
                  
                  {securityInfoOpen && (
                    <div className="mt-2 p-4 bg-navy-700 rounded-md">
                      <div className="p-4 bg-blue-900/20 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MdInfo className="h-5 w-5 text-blue-400" />
                          <h3 className="text-base font-medium text-blue-400">About Credit Card Redaction</h3>
                        </div>
                        <p className="text-sm text-gray-300">
                          This tool automatically detects credit card numbers in documents and redacts <span className="text-white font-medium">only the first 12 digits</span>, 
                          preserving the last 4 digits for verification purposes. This approach balances security with usability.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900/20 mt-0.5">
                            <MdCheck className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">PCI DSS Compliance</p>
                            <p className="text-sm text-gray-400">
                              Helps meet Payment Card Industry Data Security Standards by redacting the first 12 digits of credit card numbers
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900/20 mt-0.5">
                            <MdCheck className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Data Protection</p>
                            <p className="text-sm text-gray-400">
                              Minimizes risk of exposing sensitive payment information while maintaining the ability to verify the card
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900/20 mt-0.5">
                            <MdCheck className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">AWS Security</p>
                            <p className="text-sm text-gray-400">
                              Utilizes AWS Textract for secure document analysis with enterprise-grade security
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={processDocument}
                  disabled={isProcessing || !selectedFile}
                >
                  {isProcessing ? 'Processing...' : 'Process Document'}
                </button>
                
                {/* Processing results */}
                {processingResults.error && (
                  <div className="mt-4 p-4 rounded-lg bg-red-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MdWarning className="h-5 w-5 text-red-400" />
                      <h3 className="text-base font-medium text-red-400">Error</h3>
                    </div>
                    <p className="text-sm text-red-400">
                      {processingResults.error}
                    </p>
                  </div>
                )}
                
                {/* Show apply redactions button directly without notification */}
                {isImage && processingResults.creditCardFound && !processingResults.redactedImage && (
                  <div className="mt-4">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-navy-800"
                      onClick={() => applyRedactions(processingResults.results)}
                      disabled={isRedacting}
                    >
                      {isRedacting ? 'Redacting...' : 'Apply Redactions'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* PDF Redaction Report - Left column */}
          {processingResults.pdfRedactionReport && (
            <Card extra="w-full p-6 bg-navy-800 border-none">
              <h2 className="text-lg font-semibold text-white mb-4">PDF Redaction Report</h2>
              
              <div className="p-4 bg-amber-900/20 rounded-lg mb-4">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Note:</span> PDF documents cannot be visually redacted directly. 
                  We've generated a redaction report showing all detected credit card numbers.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Filename:</span> {processingResults.pdfRedactionReport.filename}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Cards Detected:</span> {processingResults.pdfRedactionReport.detectedCards}
                  </p>
                </div>
                
                <div className="mt-3 border border-navy-700 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-navy-700">
                    <thead className="bg-navy-900">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Original Number
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Redacted Version
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Pages
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-navy-800 divide-y divide-navy-700">
                      {processingResults.pdfRedactionReport.redactionInfo.map((info, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-navy-800' : 'bg-navy-900'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-red-400">
                            {info.cardNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-green-400">
                            {info.redactedNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {info.pagesFound.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-navy-800"
                  onClick={savePdfRedactionReport}
                >
                  Download Redaction Report
                </button>
              </div>
            </Card>
          )}
        </div>
        
        {/* Right column - Redacted document and detected credit cards */}
        <div className="flex flex-col gap-6">
          {/* Redacted document - Moved to top of right column */}
          {processingResults.redactedImage && (
            <Card extra="w-full p-6 bg-navy-800 border-none">
              <h2 className="text-lg font-semibold text-white mb-4">Redacted Document</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-center p-1 bg-navy-900 rounded-lg border border-navy-700 h-[380px]">
                  <img 
                    src={processingResults.redactedImage}
                    alt="Redacted document" 
                    className="max-w-full max-h-[370px] object-contain"
                  />
                </div>
                
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-navy-800"
                  onClick={saveRedactedImage}
                >
                  Download Redacted Image
                </button>
              </div>
            </Card>
          )}
          
          {/* Detected credit cards */}
          {(processingResults.results?.length || 0) > 0 && (
            <Card extra="w-full p-6 bg-navy-800 border-none">
              <h2 className="text-lg font-semibold text-white mb-4">Detected Credit Cards</h2>
              
              <div className="space-y-4">
                {processingResults.results?.map((result, index) => (
                  <div key={index} className="p-4 rounded-lg bg-navy-900">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-medium text-white">
                        Credit Card #{index + 1}
                      </h3>
                      <div className="flex items-center">
                        <button
                          onClick={() => copyRedactedText(result.redacted)}
                          className="p-1.5 rounded-full hover:bg-navy-800"
                          title="Copy redacted number"
                        >
                          <MdContentCopy className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="bg-red-900/20 p-2 rounded-md">
                        <p className="text-sm font-medium text-red-400">
                          Original: <span className="font-mono">{result.original}</span>
                        </p>
                      </div>
                      
                      <div className="bg-green-900/20 p-2 rounded-md">
                        <p className="text-sm font-medium text-green-400">
                          Redacted: 
                          <span className="font-mono ml-1">
                            <span className="bg-black/50 text-gray-500 px-1 rounded">****</span>
                            {' '}
                            <span className="bg-black/50 text-gray-500 px-1 rounded">****</span>
                            {' '}
                            <span className="bg-black/50 text-gray-500 px-1 rounded">****</span>
                            {' '}
                            <span className="text-green-400 px-1">{result.lastFourDigits || result.original.slice(-4)}</span>
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                        <div className="flex items-center">
                          <span className="font-semibold">Format:</span>
                          <span className="ml-1 font-mono">
                            {result.groups?.length === 4 ? (
                              <>
                                <span className="bg-red-900/20 text-red-400 px-1 mx-0.5 rounded">{result.groups[0]}</span>
                                <span className="bg-red-900/20 text-red-400 px-1 mx-0.5 rounded">{result.groups[1]}</span>
                                <span className="bg-red-900/20 text-red-400 px-1 mx-0.5 rounded">{result.groups[2]}</span>
                                <span className="text-green-400 px-1 mx-0.5">{result.groups[3]}</span>
                              </>
                            ) : (
                              result.groups?.map((group, idx) => {
                                const isLastGroup = idx === result.groups!.length - 1;
                                return (
                                  <span key={idx} className={!isLastGroup ? "bg-red-900/20 text-red-400 px-1 mx-0.5 rounded" : "text-green-400 px-1 mx-0.5"}>
                                    {group}
                                  </span>
                                );
                              })
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold mr-1">Confidence:</span>
                          High
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <MdInfo className="h-5 w-5 text-blue-400" />
                  <h3 className="text-base font-medium text-blue-400">Security Notice</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Credit card numbers have been detected and redacted for security purposes. 
                  <strong className="text-white"> Only the first 12 digits are redacted</strong>, while the last 4 digits are preserved for verification. 
                  This follows the PCI DSS guidelines for proper credit card handling.
                </p>
              </div>
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

export default CreditCardProcessingPage;
