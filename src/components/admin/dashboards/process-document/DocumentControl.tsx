import { useState, useEffect, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from 'react';
import Card from '@/components/card';
import { MdSync, MdError, MdWarning, MdCheckCircle, MdContentCopy, MdSettings, MdInfo, MdStorage, MdDragIndicator, MdAutorenew, MdClose, MdHideImage, MdNavigateNext, MdNavigateBefore } from 'react-icons/md';
import { BsCheckCircle, BsLightningCharge, BsFillCheckCircleFill } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';
import { 
  DndContext, 
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  UniqueIdentifier
} from '@dnd-kit/core';
import { Id } from '@/types/hui-types';
import { createPortal } from 'react-dom';
import ClickablePillLabel from '@/components/clickable-pill-label';

// Constants for configuration
const DYNAMODB_ELEMENT_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ELEMENT_TABLE || 'document-processor-elements';

// Known document types and their IDs to help with debugging
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'ID Document': 'byvwu9fbl62ku1dj370agewe',
  // Add more as needed
};

// Known document subtypes and their IDs
const DOCUMENT_SUBTYPE_MAP: Record<string, string> = {
  'Passport': 'aafc32e1-9cbe-4ba4-9a12-a03b19563499',
  "Driver's License": '302bbb499-cb8e-48e3-8baf-4c57f2d13107',
  // Add more as needed
};

interface DocumentElement {
  id: string;
  documentTypeId: string;
  subTypeId?: string;
  name: string;
  description?: string;
  category: string;
  required: boolean;
  action: string;
  aliases: string[];
}

interface ExtractedField {
  id?: string;
  type?: string;
  name?: string;
  label?: string;
  value?: string;
  text?: string;
  boundingBox?: any;
}

interface DocumentControlProps {
  documentType?: string;
  documentSubType?: string;
  extractedFields?: ExtractedField[];
  onFieldsMatched?: (matchedFields: Array<{
    element: DocumentElement;
    field: ExtractedField;
    matched: boolean;
  }>) => void;
  onRedactionChanged?: (redactedItems: Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
  }>) => void;
  onApplyRedactions?: (redactedItems: Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
    value?: string;
    boundingBox?: any;
  }>) => void;
  isLoading?: boolean;
  textractData?: any;
  onValidationChange?: (isValid: boolean) => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

// Drag item type definition
interface DragItem {
  id: string;
  type: 'field';
  field: ExtractedField;
}

// Render a draggable field
const DraggableField = ({ 
  field, 
  index, 
  isSelected, 
  onSelectForRedaction 
}: { 
  field: ExtractedField, 
  index: number,
  isSelected?: boolean,
  onSelectForRedaction?: (field: ExtractedField) => void
}) => {
  const fieldId = field.id || field.name || `field-${index}`;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: fieldId as UniqueIdentifier,
    data: {
      type: 'field',
      field,
      id: fieldId,
    },
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  } : undefined;
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 border rounded-md bg-white dark:bg-navy-800 relative cursor-move hover:shadow-md transition-shadow duration-200 ${
        isSelected 
          ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
          : 'border-gray-200 dark:border-navy-600'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <MdDragIndicator className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className="font-medium text-sm text-navy-700 dark:text-white">
            {field.name || field.label || `Field ${index + 1}`}
          </span>
        </div>
        {onSelectForRedaction && (
          <button 
            onClick={() => onSelectForRedaction(field)}
            className={`p-1 rounded ${
              isSelected 
                ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20' 
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700'
            }`}
            title={isSelected ? "Remove from redaction" : "Select for redaction"}
          >
            <MdHideImage className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 truncate pl-6">
        {field.value || field.text || 'No value'}
      </p>
    </div>
  );
};

// Render a droppable element
const DroppableElement = ({ 
  match, 
  index,
  onRemoveMatch,
  isSelectedForRedaction,
  onSelectForRedaction
}: { 
  match: {
    element: DocumentElement;
    field: ExtractedField | null;
    matched: boolean;
  }, 
  index: number,
  onRemoveMatch?: (elementId: string) => void,
  isSelectedForRedaction?: boolean,
  onSelectForRedaction?: (element: DocumentElement, field: ExtractedField | null) => void
}) => {
  const { element, field, matched } = match;
  
  // Check if this element requires mandatory redaction
  const requiresRedaction = element.action.toLowerCase().includes('redact');
  
  const { isOver, setNodeRef } = useDroppable({
    id: element.id as UniqueIdentifier,
    data: {
      type: 'element',
      elementId: element.id,
    },
    disabled: matched, // Can't drop on already matched elements
  });
  
  return (
    <div 
      ref={setNodeRef}
      className={`flex items-center justify-between p-2 rounded-md ${
        isSelectedForRedaction || (requiresRedaction && matched)
          ? 'bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-800/30'
          : matched 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30' 
            : 'bg-white dark:bg-navy-800 border-2 border-dashed border-gray-300 dark:border-gray-700'
      } ${
        !matched ? (
          isOver 
            ? 'border-indigo-500 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10' 
            : 'hover:border-indigo-300 dark:hover:border-indigo-700'
        ) : ''
      } transition-colors duration-200`}
    >
      <div className="flex items-center">
        {matched ? (
          <MdCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mr-2" />
        ) : (
          <MdWarning className="w-5 h-5 text-red-500 flex-shrink-0 mr-2" />
        )}
        <span className="font-medium text-navy-700 dark:text-white text-sm">
          {element.name}
        </span>
      </div>
      
      <div className="flex items-center">
        {matched && field && (
          <>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-[150px] truncate mr-2">
              {field.value || field.text || 'No value'}
            </span>
            
            <div className="flex mr-6">
              {onSelectForRedaction && (
                <button
                  onClick={() => onSelectForRedaction(element, field)}
                  className={`p-1 rounded ${
                    isSelectedForRedaction 
                      ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20' 
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700'
                  }`}
                  disabled={requiresRedaction}
                  title={requiresRedaction 
                    ? "Redaction required by configuration" 
                    : (isSelectedForRedaction ? "Remove from redaction" : "Select for redaction")}
                  style={requiresRedaction ? { opacity: isSelectedForRedaction ? 1 : 0.5, cursor: 'not-allowed' } : {}}
                >
                  <MdHideImage className="w-4 h-4" />
                </button>
              )}
              
              {onRemoveMatch && (
                <button
                  onClick={() => onRemoveMatch(element.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Remove match"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
        
        {!matched && (
          <span className="text-xs text-gray-500 mr-8">
            {isOver ? "Drop to match" : "Drop field here"}
          </span>
        )}
      </div>
    </div>
  );
};

// Custom Droppable Element for the "Add Data Element" functionality
const DroppableCustomElement = ({ 
  element, 
  index,
  onRemoveMatch,
  onDelete
}: { 
  element: {
    id: string;
    field: ExtractedField | null;
    matched: boolean;
  }, 
  index: number,
  onRemoveMatch?: (elementId: string) => void,
  onDelete?: (elementId: string) => void
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: element.id as UniqueIdentifier,
    data: {
      type: 'custom-element',
      elementId: element.id,
    },
    disabled: element.matched, // Can't drop on already matched elements
  });
  
  return (
    <div 
      ref={setNodeRef}
      className={`flex items-center justify-between p-2 rounded-md ${
        element.matched 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30' 
          : 'bg-white dark:bg-navy-800 border-2 border-dashed border-gray-300 dark:border-gray-700'
      } ${
        !element.matched ? (
          isOver 
            ? 'border-indigo-500 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10' 
            : 'hover:border-indigo-300 dark:hover:border-indigo-700'
        ) : ''
      } transition-colors duration-200`}
    >
      <div className="flex items-center">
        {element.matched ? (
          <MdCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mr-2" />
        ) : (
          <MdDragIndicator className="w-5 h-5 text-gray-400 flex-shrink-0 mr-2" />
        )}
        <span className="font-medium text-navy-700 dark:text-white text-sm">
          {element.matched && element.field?.name 
            ? element.field.name 
            : `Custom Element ${index + 1}`}
        </span>
      </div>
      
      <div className="flex items-center">
        {element.matched && element.field && (
          <>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 max-w-[150px] truncate mr-2">
              {element.field.value || element.field.text || 'No value'}
            </span>
            
            <div className="flex mr-6">
              {onRemoveMatch && (
                <button
                  onClick={() => onRemoveMatch(element.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Remove match"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
        
        {!element.matched && (
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">
              {isOver ? "Drop to match" : "Drop field here"}
            </span>
            
            {onDelete && (
              <button
                onClick={() => onDelete(element.id)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-navy-700"
                title="Delete custom element"
              >
                <MdClose className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Define interface for the exposed methods
export interface DocumentControlHandle {
  autoMatchFields: () => number;
  handleApplyRedactions: () => Array<{
    id: string;
    type: 'element' | 'field';
    name: string;
    value?: string;
    boundingBox?: any;
  }>;
}

// Convert to ForwardRefRenderFunction
const DocumentControl: ForwardRefRenderFunction<DocumentControlHandle, DocumentControlProps> = (
  {
    documentType,
    documentSubType,
    extractedFields = [],
    onFieldsMatched,
    onRedactionChanged,
    onApplyRedactions,
    isLoading = false,
    textractData,
    onValidationChange,
    isExpanded: externalIsExpanded,
    onExpandChange
  },
  ref
) => {
  const [documentElements, setDocumentElements] = useState<DocumentElement[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedElements, setMatchedElements] = useState<Array<{
    element: DocumentElement;
    field: ExtractedField | null;
    matched: boolean;
  }>>([]);
  const [internalIsExpanded, setInternalIsExpanded] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
  // Use external or internal state based on whether props are provided
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  
  // Toggle function that updates the appropriate state
  const toggleExpanded = () => {
    if (onExpandChange) {
      onExpandChange(!isExpanded);
    } else {
      setInternalIsExpanded(!isExpanded);
    }
  };
  
  // State for drag and drop
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  // Force update counter to trigger re-renders after drag operations
  const [forceUpdate, setForceUpdate] = useState(0);
  // State for auto-match results
  const [autoMatchResults, setAutoMatchResults] = useState<{count: number, timestamp: number} | null>(null);
  
  // State for redaction
  const [redactedElements, setRedactedElements] = useState<Set<string>>(new Set());
  const [redactedFields, setRedactedFields] = useState<Set<string>>(new Set());
  
  // New state for redaction process
  const [isApplyingRedactions, setIsApplyingRedactions] = useState(false);
  const [redactionsApplied, setRedactionsApplied] = useState(false);
  
  // New state for removed required elements
  const [removedRequiredElements, setRemovedRequiredElements] = useState<Set<string>>(new Set());
  
  // New state for search and pagination of unmatched fields
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 items per page
  
  // New state for custom elements
  const [customElements, setCustomElements] = useState<Array<{
    id: string;
    field: ExtractedField | null;
    matched: boolean;
  }>>([]);
  
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );
  
  // Fetch document elements from DynamoDB based on document type and subtype
  useEffect(() => {
    const fetchDocumentElements = async () => {
      if (!documentType) return;
      
      setIsLoadingElements(true);
      setError(null);
      
      try {
        // API call to get document elements from DynamoDB
        const response = await fetch(`/api/docs-3-process/document-elements?documentType=${documentType}${documentSubType ? `&subType=${documentSubType}` : ''}`);
        setFetchAttempted(true);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch document elements: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // The responseData should be an array of elements
        setDocumentElements(Array.isArray(responseData) ? responseData : []);
      } catch (error) {
        console.error('Error fetching document elements:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingElements(false);
      }
    };
    
    fetchDocumentElements();
  }, [documentType, documentSubType]);

  // Separate useEffect to handle matching elements with fields whenever either changes
  useEffect(() => {
    // Only run matching if we have both document elements and extracted fields
    if (documentElements.length > 0 && extractedFields.length > 0) {
      // Create a stable reference to the current state to avoid continuous loops
      const currentElements = [...documentElements];
      const currentFields = [...extractedFields];
      
      // Use a ref to track if this is the first run to avoid continuous loops
      const isFirstRun = !matchedElements.some(m => m.matched);
      
      // Only run matching if we don't have matches yet or if explicitly needed
      if (isFirstRun) {
        matchElementsWithFields(currentElements);
      }
    }
  }, [documentElements, extractedFields]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omitting matchedElements from dependencies to break the loop

  // Function to check if an element requires mandatory redaction
  const requiresRedaction = (element: DocumentElement): boolean => {
    return element.action.toLowerCase().includes('redact');
  };
  
  // Match document elements with extracted fields based on name and aliases
  const matchElementsWithFields = (elements: DocumentElement[]) => {
    if (!elements.length || !extractedFields.length) {
      setMatchedElements(elements.map(element => ({
        element,
        field: null,
        matched: false
      })));
      return;
    }
    
    // Check if we already have matches - if so, avoid unnecessary re-matching
    const hasExistingMatches = matchedElements.some(m => m.matched);
    if (hasExistingMatches && matchedElements.length === elements.length) {
      // We already have matched elements, so no need to re-match
      console.log('Skipping re-matching as matches already exist');
      return;
    }
    
    // Collect elements that need redaction
    const elementsToRedact = new Set<string>();
    
    const matches = elements.map(element => {
      // Try to find a match in extracted fields based on name or aliases
      const matchedField = extractedFields.find(field => {
        const fieldName = field.name || field.label || '';
        
        // Check if field name matches element name (case insensitive)
        if (fieldName.toLowerCase() === element.name.toLowerCase()) {
          return true;
        }
        
        // Check if field name matches any of the element aliases (case insensitive)
        return element.aliases.some(alias => 
          fieldName.toLowerCase() === alias.toLowerCase()
        );
      });
      
      // Check if this element requires redaction based on its action
      if (requiresRedaction(element) && matchedField) {
        // Add to collection instead of updating state directly
        elementsToRedact.add(element.id);
      }
      
      return {
        element,
        field: matchedField || null,
        matched: !!matchedField
      };
    });
    
    // Batch state updates
    setMatchedElements(matches);
    
    // Only update redacted elements if we found any
    if (elementsToRedact.size > 0) {
      setRedactedElements(prev => {
        const newSet = new Set(prev);
        elementsToRedact.forEach(id => newSet.add(id));
        return newSet;
      });
    
      // Notify parent component of matched fields
      if (onFieldsMatched) {
        onFieldsMatched(matches.filter(m => m.matched).map(m => ({
          element: m.element,
          field: m.field!,
          matched: m.matched
        })));
      }
      
      // Only update redacted items if we actually changed something
      setTimeout(() => {
        updateRedactionItems();
      }, 50); // Slight delay to ensure state updates are processed
    } else if (matches.some(m => m.matched) && onFieldsMatched) {
      // Still notify about matches even if no redactions
      onFieldsMatched(matches.filter(m => m.matched).map(m => ({
        element: m.element,
        field: m.field!,
        matched: m.matched
      })));
    }
  };
  
  // Function to automatically match unmatched fields to elements
  const autoMatchFields = () => {
    // Get all unmatched fields
    const unmatchedFields = getUnmatchedFields();
    if (!unmatchedFields.length) {
      setAutoMatchResults({ count: 0, timestamp: Date.now() });
      return 0;
    }
    
    // Get all unmatched elements
    const unmatchedElements = matchedElements.filter(match => !match.matched);
    if (!unmatchedElements.length) {
      setAutoMatchResults({ count: 0, timestamp: Date.now() });
      return 0;
    }
    
    // Create matches based on similarity between field names and element names/aliases
    const newMatches = [...matchedElements];
    let matchCount = 0;
    
    // Normalize a string for comparison (remove special chars, extra spaces, convert to lowercase)
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
        .trim();
    };
    
    // Expand common abbreviations
    const expandAbbreviations = (str: string): string[] => {
      const expansions: Record<string, string> = {
        'dob': 'date of birth',
        'id': 'identification',
        'ssn': 'social security number',
        'lic': 'license',
        'num': 'number',
        'no': 'number',
        'addr': 'address',
        'exp': 'expiration',
        'dl': 'drivers license',
        'ln': 'last name',
        'fn': 'first name',
        'mi': 'middle initial',
        'lname': 'last name',
        'fname': 'first name',
        'mname': 'middle name',
        'apt': 'apartment',
        'st': 'street',
        'dr': 'drive',
        'rd': 'road',
        'ave': 'avenue',
        'tel': 'telephone',
        'ph': 'phone',
        'dln': 'drivers license number',
        'dlno': 'drivers license number',
        'idno': 'identification number',
      };
      
      // Return original string and potential expansions
      const result = [str];
      
      // Check for entire string match
      if (expansions[str]) {
        result.push(expansions[str]);
      }
      
      // Check for word-by-word expansions
      const words = str.split(' ');
      if (words.length > 1) {
        const expandedWords = words.map(word => expansions[word] || word);
        if (expandedWords.some((word, idx) => word !== words[idx])) {
          result.push(expandedWords.join(' '));
        }
      }
      
      return result;
    };
    
    // Calculate string similarity score (0-100)
    const calculateSimilarity = (str1: string, str2: string): number => {
      const a = normalizeString(str1);
      const b = normalizeString(str2);
      
      // Exact match
      if (a === b) return 100;
      
      // One string contains the other
      if (a.includes(b) || b.includes(a)) {
        const lengthRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
        return 80 * lengthRatio; // 80% score, adjusted by length ratio
      }
      
      // Check for word overlap
      const aWords = a.split(' ').filter(w => w.length > 1);
      const bWords = b.split(' ').filter(w => w.length > 1);
      
      if (aWords.length === 0 || bWords.length === 0) return 0;
      
      // Count how many words from a appear in b and vice versa
      const aInB = aWords.filter(word => bWords.some(bWord => bWord.includes(word) || word.includes(bWord))).length;
      const bInA = bWords.filter(word => aWords.some(aWord => aWord.includes(word) || word.includes(aWord))).length;
      
      const overlapScore = (aInB / aWords.length + bInA / bWords.length) * 50;
      
      return overlapScore;
    };
    
    // For each unmatched field, find the best matching element
    unmatchedFields.forEach(field => {
      const fieldName = field.name || field.label || '';
      if (!fieldName) return;
      
      // Normalize field name
      const normalizedFieldName = normalizeString(fieldName);
      
      // Create expanded field names with common abbreviations
      const expandedFieldNames = expandAbbreviations(normalizedFieldName);
      
      // Track the best match and its score
      let bestMatch = -1;
      let bestScore = 0;
      
      // For each unmatched element, calculate match scores
      unmatchedElements.forEach((elementMatch, index) => {
        const element = elementMatch.element;
        
        // Calculate similarity with element name
        const nameScore = expandedFieldNames.reduce((highestScore, expandedFieldName) => {
          const similarity = calculateSimilarity(expandedFieldName, element.name);
          return Math.max(highestScore, similarity);
        }, 0);
        
        // Calculate similarity with element aliases
        const aliasesScore = element.aliases.reduce((highestScore, alias) => {
          // Try all expanded field names against this alias
          const score = expandedFieldNames.reduce((best, expandedFieldName) => {
            const similarity = calculateSimilarity(expandedFieldName, alias);
            return Math.max(best, similarity);
          }, 0);
          
          return Math.max(highestScore, score);
        }, 0);
        
        // Use the highest score between name match and alias match
        const matchScore = Math.max(nameScore, aliasesScore);
        
        // If this is the best match so far, update bestMatch and bestScore
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = index;
        }
      });
      
      // Only consider matches with a minimum score threshold
      const MIN_MATCH_THRESHOLD = 50; // Minimum score to consider a match valid
      
      if (bestMatch !== -1 && bestScore >= MIN_MATCH_THRESHOLD) {
        const matchingElement = unmatchedElements[bestMatch];
        const elementId = matchingElement.element.id;
        
        // Find the matching element in newMatches and update it
        const matchIndex = newMatches.findIndex(m => m.element.id === elementId);
        if (matchIndex !== -1) {
          newMatches[matchIndex] = {
            ...newMatches[matchIndex],
            field,
            matched: true
          };
          
          // Add to redaction if needed
          if (requiresRedaction(newMatches[matchIndex].element)) {
            setRedactedElements(prevRedacted => {
              const newSet = new Set(prevRedacted);
              newSet.add(elementId);
              return newSet;
            });
          }
          
          // Remove the matched element from unmatchedElements to prevent duplicate matches
          unmatchedElements.splice(bestMatch, 1);
          matchCount++;
          
          // Debug logging
          console.log(`Matched "${fieldName}" to "${matchingElement.element.name}" with score ${bestScore}`);
        }
      }
    });
    
    // Only update state if we made some matches
    if (matchCount > 0) {
      setMatchedElements(newMatches);
      
      // Notify parent of updated matches
      if (onFieldsMatched) {
        const matchedFields = newMatches
          .filter(m => m.matched)
          .map(m => ({
            element: m.element,
            field: m.field!,
            matched: m.matched
          }));
        
        onFieldsMatched(matchedFields);
      }
      
      // Force a re-render to ensure UI updates
      setForceUpdate(prev => prev + 1);
      
      // Auto-apply redactions if any elements require redaction
      // Need to use setTimeout to ensure all state updates have been processed
      setTimeout(() => {
        // Check if we have elements to redact after matching
        if (hasElementsToRedact()) {
          console.log('Auto-applying redactions after auto-match');
          handleApplyRedactions();
        }
      }, 100);
    }
    
    // Set the auto-match results
    setAutoMatchResults({ count: matchCount, timestamp: Date.now() });
    
    return matchCount;
  };
  
  // Get unmatched fields
  const getUnmatchedFields = () => {
    // More thorough check for matched fields using common identifiers
    return extractedFields.filter(field => {
      const fieldIdentifiers = [
        field.id,
        field.name,
        field.label
      ].filter(Boolean); // Remove undefined/null values
      
      // Check if any of our matched elements has this field
      return !matchedElements.some(match => {
        if (!match.matched || !match.field) return false;
        
        const matchFieldIdentifiers = [
          match.field.id,
          match.field.name,
          match.field.label
        ].filter(Boolean);
        
        // Check for any intersection between the identifiers
        return fieldIdentifiers.some(id => 
          matchFieldIdentifiers.includes(id)
        );
      });
    });
  };
  
  // Get filtered unmatched fields based on search query
  const getFilteredUnmatchedFields = () => {
    const unmatchedFields = getUnmatchedFields();
    
    if (!searchQuery.trim()) {
      return unmatchedFields;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return unmatchedFields.filter(field => {
      const fieldName = (field.name || field.label || '').toLowerCase();
      const fieldValue = (field.value || field.text || '').toLowerCase();
      
      return fieldName.includes(query) || fieldValue.includes(query);
    });
  };
  
  // Get paginated unmatched fields
  const getPaginatedUnmatchedFields = () => {
    const filteredFields = getFilteredUnmatchedFields();
    const totalPages = Math.ceil(filteredFields.length / itemsPerPage);
    
    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      fields: filteredFields.slice(startIndex, endIndex),
      totalPages,
      totalItems: filteredFields.length
    };
  };
  
  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  // Manually match a field to an element
  const matchFieldToElement = (elementId: string, field: ExtractedField) => {
    setMatchedElements(prev => {
      const updated = prev.map(match => {
        if (match.element.id === elementId) {
          // If this match requires redaction, add it to redacted elements
          if (requiresRedaction(match.element)) {
            setRedactedElements(prevRedacted => {
              const newSet = new Set(prevRedacted);
              newSet.add(match.element.id);
              return newSet;
            });
            
            // Schedule an update of redacted items
            setTimeout(() => {
              updateRedactionItems();
            }, 0);
          }
          
          return {
            ...match,
            field,
            matched: true
          };
        }
        return match;
      });
      
      // Notify parent of updated matches after updating state
      if (onFieldsMatched) {
        const matchedFields = updated
          .filter(m => m.matched)
          .map(m => ({
            element: m.element,
            field: m.field!,
            matched: true
          }));
        
        onFieldsMatched(matchedFields);
      }
      
      return updated;
    });
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
  };
  
  // Remove a match
  const removeMatch = (elementId: string) => {
    setMatchedElements(prev => {
      const updated = prev.map(match => {
        if (match.element.id === elementId) {
          return {
            ...match,
            field: null,
            matched: false
          };
        }
        return match;
      });
      
      // Notify parent of updated matches after updating state
      if (onFieldsMatched) {
        const matchedFields = updated
          .filter(m => m.matched)
          .map(m => ({
            element: m.element,
            field: m.field!,
            matched: true
          }));
        
        onFieldsMatched(matchedFields);
      }
      
      return updated;
    });
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
  };
  
  // Toggle element redaction
  const toggleElementRedaction = (element: DocumentElement, field: ExtractedField | null) => {
    // Check if this element has a mandatory redaction (action contains 'redact')
    if (requiresRedaction(element)) {
      // If the element requires redaction, we should not allow to un-redact it
      // Make sure it's added to redacted elements
      setRedactedElements(prev => {
        const newSet = new Set(prev);
        newSet.add(element.id);
        return newSet;
      });
    } else {
      // Normal toggle behavior for non-mandatory redactions
      setRedactedElements(prev => {
        const newSet = new Set(prev);
        if (newSet.has(element.id)) {
          newSet.delete(element.id);
        } else {
          newSet.add(element.id);
        }
        return newSet;
      });
    }
    
    // Notify parent of updated redacted items
    updateRedactionItems();
  };
  
  // Toggle field redaction
  const toggleFieldRedaction = (field: ExtractedField) => {
    const fieldId = field.id || field.name || field.label || '';
    if (!fieldId) return;
    
    setRedactedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
    
    // Notify parent of updated redacted items
    updateRedactionItems();
  };
  
  // Helper to update parent about redacted items
  const updateRedactionItems = () => {
    if (!onRedactionChanged) return;
    
    // Prevent excessive updates by checking if we're mounting or if real changes happened
    const redactedElementsCount = redactedElements.size;
    const redactedFieldsCount = redactedFields.size;
    
    // Use a more stable approach to update
    setTimeout(() => {
      const redactedItems = [];
      
      // Find all elements that need redaction (either manually selected or due to action)
      for (const match of matchedElements) {
        if (match.matched && (
            redactedElements.has(match.element.id) || 
            (requiresRedaction(match.element))
          )) {
          redactedItems.push({
            id: match.element.id,
            type: 'element' as const,
            name: match.element.name
          });
        }
      }
      
      // Add redacted fields
      for (const fieldId of Array.from(redactedFields)) {
        const field = extractedFields.find(f => 
          (f.id && f.id === fieldId) || f.name === fieldId || f.label === fieldId
        );
        if (field) {
          redactedItems.push({
            id: fieldId,
            type: 'field' as const,
            name: field.name || field.label || 'Unknown field'
          });
        }
      }
      
      // Only call the callback if we have redacted items or if the counts have changed
      if (redactedItems.length > 0 || 
          redactedElementsCount > 0 || 
          redactedFieldsCount > 0) {
        onRedactionChanged(redactedItems);
      }
    }, 0);
  };
  
  // Check if element is selected for redaction
  const isElementSelectedForRedaction = (elementId: string) => {
    // Find the element to check if it requires redaction by action
    const elementMatch = matchedElements.find(match => match.element.id === elementId);
    const requiresMandatoryRedaction = elementMatch && requiresRedaction(elementMatch.element) && elementMatch.matched;
    
    // Element is selected if manually added to redactedElements OR it requires mandatory redaction
    return redactedElements.has(elementId) || !!requiresMandatoryRedaction;
  };
  
  // Check if field is selected for redaction
  const isFieldSelectedForRedaction = (field: ExtractedField) => {
    const fieldId = field.id || field.name || field.label || '';
    return fieldId ? redactedFields.has(fieldId) : false;
  };
  
  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === 'field') {
      setActiveDragItem(active.data.current as DragItem);
    }
  };
  
  // Handle drag end event - enhance to support dragging to unmatched fields container
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragItem(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    // Check if we're dropping onto an element
    if (over.data.current?.type === 'element') {
      const elementId = over.data.current.elementId;
      const fieldId = active.data.current?.id;
      
      if (elementId && fieldId) {
        const field = extractedFields.find(f => 
          (f.id && f.id === fieldId) || 
          (f.name && f.name === fieldId) || 
          `field-${extractedFields.indexOf(f)}` === fieldId
        );
        
        if (field) {
          // We need to manually redraw after drag completes to ensure UI updates correctly
          setTimeout(() => {
            matchFieldToElement(elementId, field);
          }, 0);
        }
      }
    }
    // Check if we're dropping onto a custom element
    else if (over.data.current?.type === 'custom-element') {
      const customElementId = over.data.current.elementId;
      const fieldId = active.data.current?.id;
      
      if (customElementId && fieldId) {
        const field = extractedFields.find(f => 
          (f.id && f.id === fieldId) || 
          (f.name && f.name === fieldId) || 
          `field-${extractedFields.indexOf(f)}` === fieldId
        );
        
        if (field) {
          // We need to manually redraw after drag completes to ensure UI updates correctly
          setTimeout(() => {
            matchFieldToCustomElement(customElementId, field);
          }, 0);
        }
      }
    }
    // Check if we're dropping into the unmatched fields container
    else if (over.id === 'unmatched-fields-container') {
      // No action needed, field is already unmatched
      console.log('Field dropped back into unmatched container');
    }
  };
  
  // Lookup functions to help with debugging
  const getDocumentTypeId = (type: string | undefined) => {
    if (!type) return 'unknown';
    return DOCUMENT_TYPE_MAP[type] || 'Not found in mapping';
  };
  
  const getDocumentSubTypeId = (subType: string | undefined) => {
    if (!subType) return 'none';
    return DOCUMENT_SUBTYPE_MAP[subType] || 'Not found in mapping';
  };

  // Calculate matching statistics
  const matchStats = {
    total: matchedElements.length,
    matched: matchedElements.filter(m => m.matched).length,
    requiredTotal: matchedElements.filter(m => m.element.required).length,
    requiredMatched: matchedElements.filter(m => m.element.required && m.matched).length,
    requiredRemoved: Array.from(removedRequiredElements).length,
    requiredUnresolved: matchedElements.filter(m => 
      m.element.required && 
      !m.matched && 
      !removedRequiredElements.has(m.element.id)
    ).length,
  };

  // Find bounding box for a field based on its value
  const findBoundingBoxForField = (fieldValue: string): any | undefined => {
    if (!textractData || !fieldValue) return undefined;
    
    try {
      const blocks = textractData.Blocks || [];
      console.log(`Searching for bounding box of "${fieldValue}" in ${blocks.length} blocks`);
      
      // First, look for an exact match
      for (const block of blocks) {
        if ((block.BlockType === 'LINE' || block.BlockType === 'WORD' || block.BlockType === 'KEY_VALUE_SET') && 
            block.Text === fieldValue && 
            block.Geometry?.BoundingBox) {
          console.log(`Found exact match for "${fieldValue}"`);
          return block.Geometry.BoundingBox;
        }
      }
      
      // If no exact match, try normalized matches (lowercase, no spaces, etc.)
      const normalizedFieldValue = fieldValue.toLowerCase().replace(/\s+/g, '').trim();
      for (const block of blocks) {
        if (block.Text) {
          const normalizedBlockText = block.Text.toLowerCase().replace(/\s+/g, '').trim();
          if (normalizedBlockText === normalizedFieldValue && block.Geometry?.BoundingBox) {
            console.log(`Found normalized match for "${fieldValue}" as "${block.Text}"`);
            return block.Geometry.BoundingBox;
          }
        }
      }
      
      // If still no match, try partial matches
      for (const block of blocks) {
        if (block.Text && 
            (block.Text.includes(fieldValue) || fieldValue.includes(block.Text)) && 
            block.Geometry?.BoundingBox) {
          console.log(`Found partial match for "${fieldValue}" with "${block.Text}"`);
          return block.Geometry.BoundingBox;
        }
      }
      
      // Try looking for each word in the field value
      const words = fieldValue.split(/\s+/).filter(word => word.length > 3);
      for (const word of words) {
        for (const block of blocks) {
          if (block.Text && 
              block.Text.toLowerCase().includes(word.toLowerCase()) && 
              block.Geometry?.BoundingBox) {
            console.log(`Found word match for "${word}" in "${fieldValue}" with "${block.Text}"`);
            return block.Geometry.BoundingBox;
          }
        }
      }
      
      console.log(`Could not find any bounding box for "${fieldValue}"`);
    } catch (error) {
      console.error('Error finding bounding box:', error);
    }
    
    return undefined;
  };

  // Handle applying redactions
  const handleApplyRedactions = () => {
    if (!onApplyRedactions) return [];
    
    setIsApplyingRedactions(true);
    console.log("Starting to collect redacted items");
    
    try {
      const redactedItems: Array<{
        id: string;
        type: 'element' | 'field';
        name: string;
        value?: string;
        boundingBox?: any;
      }> = [];
      
      // Process all matched elements that need redaction
      for (const matchData of matchedElements) {
        const { element, field, matched } = matchData;
        
        // Skip if not matched or doesn't need redaction
        if (!matched || 
            (!redactedElements.has(element.id) && !requiresRedaction(element))) {
          continue;
        }
        
        console.log(`Processing redacted element: ${element.name}`);
        
        // Determine the best value to use for finding the text in the document
        let valueForRedaction = field?.text || field?.value;
        let boundingBox = undefined;
        
        if (valueForRedaction) {
          // Try to find bounding box from Textract data
          boundingBox = findBoundingBoxForField(valueForRedaction);
          console.log(`Element ${element.name} has value "${valueForRedaction}" with bounding box:`, boundingBox);
        } else {
          // Try using the element name as a fallback
          console.log(`No field value for ${element.name}, trying to use element name`);
          boundingBox = findBoundingBoxForField(element.name);
        }
        
        redactedItems.push({
          id: element.id,
          type: 'element',
          name: element.name,
          value: valueForRedaction,
          boundingBox
        });
      }
      
      // Process all standalone fields marked for redaction
      // Convert Set to Array before iterating
      Array.from(redactedFields).forEach(fieldId => {
        const field = extractedFields.find(f => f.id === fieldId);
        if (!field) return;
        
        console.log(`Processing redacted field: ${field.name || field.text || field.value}`);
        
        // Try to find bounding box from Textract data
        const valueForRedaction = field.text || field.value;
        let boundingBox = undefined;
        
        if (valueForRedaction) {
          boundingBox = findBoundingBoxForField(valueForRedaction);
          console.log(`Field ${field.name || 'unnamed'} has value "${valueForRedaction}" with bounding box:`, boundingBox);
        }
        
        redactedItems.push({
          id: field.id || `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'field',
          name: field.name || field.label || 'Unnamed Field',
          value: valueForRedaction,
          boundingBox
        });
      });
      
      // Call the parent component's callback with the redacted items
      console.log(`Applying ${redactedItems.length} redactions`, redactedItems);
      onApplyRedactions(redactedItems);
      
      setIsApplyingRedactions(false);
      setRedactionsApplied(true);
      
      // Return the redacted items so the parent component can use them directly
      return redactedItems;
    } catch (error) {
      console.error('Error applying redactions:', error);
      setIsApplyingRedactions(false);
      return [];
    }
  };

  // Check validation status and notify parent component
  useEffect(() => {
    if (!onValidationChange) return;
    
    // Check if all required elements that are not removed are matched
    const requiredElementsUnmatched = matchedElements.filter(match => 
      match.element.required && 
      !match.matched && 
      !removedRequiredElements.has(match.element.id)
    ).length;
    
    // Valid if all required elements are either matched or explicitly removed
    const isValid = requiredElementsUnmatched === 0;
    
    onValidationChange(isValid);
  }, [matchedElements, removedRequiredElements, onValidationChange]);

  // Toggle removed status for a required element
  const toggleRequiredElementRemoval = (elementId: string) => {
    setRemovedRequiredElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  // Helper to check if an element is in the removed list
  const isRequiredElementRemoved = (elementId: string) => {
    return removedRequiredElements.has(elementId);
  };

  // Function to add a custom element
  const addCustomElement = () => {
    const newElementId = `custom-element-${Date.now()}`;
    
    // Add a new custom element to the state
    setCustomElements(prev => [
      ...prev, 
      {
        id: newElementId,
        field: null,
        matched: false
      }
    ]);
    
    // Force update to re-render the UI
    setForceUpdate(prev => prev + 1);
  };
  
  // Function to handle a field being dropped on a custom element
  const matchFieldToCustomElement = (customElementId: string, field: ExtractedField) => {
    setCustomElements(prev => {
      const updated = prev.map(element => {
        if (element.id === customElementId) {
          return {
            ...element,
            field,
            matched: true
          };
        }
        return element;
      });
      
      return updated;
    });
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
  };
  
  // Remove a custom element match
  const removeCustomElementMatch = (customElementId: string) => {
    setCustomElements(prev => {
      const updated = prev.map(element => {
        if (element.id === customElementId) {
          return {
            ...element,
            field: null,
            matched: false
          };
        }
        return element;
      });
      
      return updated;
    });
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
  };
  
  // Delete a custom element
  const deleteCustomElement = (customElementId: string) => {
    setCustomElements(prev => prev.filter(element => element.id !== customElementId));
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
  };

  // Check if there are any elements to redact (either manual or required by configuration)
  const hasElementsToRedact = (): boolean => {
    const hasManualRedactions = redactedElements.size > 0 || redactedFields.size > 0;
    const hasRequiredRedactions = matchedElements.some(
      match => match.matched && requiresRedaction(match.element)
    );
    
    return hasManualRedactions || hasRequiredRedactions;
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    autoMatchFields,
    handleApplyRedactions
  }));

  return (
    <Card extra="w-full p-6" data-testid="document-control">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-navy-700 dark:text-white">Document Control</h3>
          {/* Inserted clickable pill label for required elements resolved status */}
          <div className="flex items-center gap-2">
          {matchStats.requiredTotal > 0 && (
            <div className="dark:text-white">
              <ClickablePillLabel
                label={
                  matchStats.requiredUnresolved === 0
                    ? `All ${matchStats.requiredTotal} Required Resolved`
                    : `${matchStats.requiredTotal - matchStats.requiredUnresolved}/${matchStats.requiredTotal} Resolved`
                }
                icon={
                  matchStats.requiredUnresolved === 0
                    ? <BsFillCheckCircleFill />
                    : <MdWarning />
                }
                iconColor={
                  matchStats.requiredUnresolved === 0
                    ? 'text-green-500'
                    : 'text-amber-500'
                }
                bg={
                  matchStats.requiredUnresolved === 0
                    ? 'bg-[#C9FBD5] dark:!bg-navy-700'
                    : 'bg-[#FFF6DA] dark:!bg-navy-700'
                }
                mb="mb-0"
                onClick={() => {}}
              />
            </div>
          )}
          <button
            onClick={toggleExpanded}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-navy-700"
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-2">
          {(isLoadingElements || isLoading) ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-navy-700 dark:text-white">Loading document elements...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 py-6 text-red-500">
              <div className="flex items-center mb-2">
                <MdError className="w-6 h-6 mr-2" />
                <span>Error loading document elements</span>
              </div>
              <p className="text-sm text-red-400 mb-3">{error}</p>
              
              <div className="w-full max-w-md p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                <div className="flex items-center mb-2">
                  <MdStorage className="w-5 h-5 mr-1 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Troubleshooting DynamoDB Issues:</span>
                </div>

                <div className="mt-8 pt-3 border-t border-red-200 dark:border-red-800">
                  <div className="flex items-center mb-2">
                    <MdStorage className="w-5 h-5 mr-1 text-amber-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Document Type Configuration:</span>
                  </div>
                  <div className="bg-white dark:bg-navy-800 p-3 rounded-md text-xs">
                    <p><span className="font-semibold">Document Type:</span> {documentType || 'Unknown'}</p>
                    <p><span className="font-semibold">Expected documentTypeId:</span> {getDocumentTypeId(documentType)}</p>
                    {documentSubType && (
                      <>
                        <p><span className="font-semibold">Document SubType:</span> {documentSubType}</p>
                        <p><span className="font-semibold">Expected subTypeId:</span> {getDocumentSubTypeId(documentSubType)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : documentElements.length === 0 && fetchAttempted ? (
            <div className="flex flex-col items-center justify-center p-6 text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="flex items-center mb-3">
                <MdSettings className="w-6 h-6 mr-2 text-amber-500" />
                <span className="font-medium">No document elements configured</span>
              </div>
              <p className="text-sm text-center max-w-md">
                No data elements are configured for this document type. 
                This could be due to:
              </p>

              <div className="w-full max-w-md mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <div className="flex items-center mb-2">
                  <MdStorage className="w-5 h-5 mr-1 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Expected DynamoDB Configuration:</span>
                </div>
                <div className="bg-white dark:bg-navy-800 p-3 rounded-md text-xs">
                  <p><span className="font-semibold">DynamoDB Table:</span> {DYNAMODB_ELEMENT_TABLE}</p>
                  <p><span className="font-semibold">Document Type:</span> {documentType || 'Unknown'}</p>
                  <p><span className="font-semibold">Expected documentTypeId:</span> {getDocumentTypeId(documentType)}</p>
                  {documentSubType && (
                    <>
                      <p><span className="font-semibold">Document SubType:</span> {documentSubType}</p>
                      <p><span className="font-semibold">Expected subTypeId:</span> {getDocumentSubTypeId(documentSubType)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="my-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {matchStats.matched}/{matchStats.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Elements Matched
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${
                    matchStats.requiredUnresolved === 0
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {matchStats.requiredTotal - matchStats.requiredUnresolved}/{matchStats.requiredTotal}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Required Elements Resolved
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {matchStats.matched ? Math.round((matchStats.matched / matchStats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Match Rate
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {getUnmatchedFields().length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Unmatched Fields
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {/* Unmatched extracted fields - updated with search and pagination */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Extracted Fields <span className="text-gray-500 dark:text-gray-700">(Unmatched)</span>
                        </h4>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={autoMatchFields}
                          className="flex items-center mr-3 px-3 py-1 text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <BsLightningCharge className="mr-1" />
                          Auto-Match
                        </button>
                      </div>
                    </div>
                    
                    {/* Search input for unmatched fields */}
                    <div className="mb-3 flex h-10 w-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white">
                      <span className="pl-3 pr-2 text-xl">
                        <FiSearch className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search fields..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-gray-300 dark:border dark:border-navy-700"
                      />
                    </div>
                    
                    <div 
                      id="unmatched-fields-container"
                      className="rounded-lg p-3"
                    >
                      {getPaginatedUnmatchedFields().totalItems > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {getPaginatedUnmatchedFields().fields.map((field, index) => (
                            <DraggableField 
                              key={field.id || field.name || `drag-${index}`}
                              field={field}
                              index={index}
                              isSelected={isFieldSelectedForRedaction(field)}
                              onSelectForRedaction={toggleFieldRedaction}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">
                          {searchQuery ? 'No fields match your search' : 'All fields have been matched'}
                        </p>
                      )}
                      
                      {/* Pagination */}
                      {getPaginatedUnmatchedFields().totalPages > 1 && (
                        <div className="flex w-full items-center justify-center rounded-lg pt-4 px-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdNavigateBefore className="h-4 w-4" />
                          </button>
                          <div className="mx-4 flex items-center text-sm text-navy-700 dark:text-white">
                            <span className="font-bold">{currentPage}</span>
                            <span className="mx-1">/</span>
                            <span>{getPaginatedUnmatchedFields().totalPages}</span>
                          </div>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getPaginatedUnmatchedFields().totalPages))}
                            disabled={currentPage === getPaginatedUnmatchedFields().totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdNavigateNext className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {/* Combined Data Elements Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Resolved Data Elements
                        </h4>
                        <button
                          onClick={handleApplyRedactions}
                          disabled={isApplyingRedactions || !hasElementsToRedact()}
                          className="flex items-center mr-3 px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isApplyingRedactions ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Applying...
                            </>
                          ) : (
                            <>
                              <MdHideImage className="mr-1" />
                              Apply Redactions
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg p-3 max-h-[550px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-2">
                          {/* All elements - both required and optional */}
                          {matchedElements
                            .filter(match => !removedRequiredElements.has(match.element.id))
                            .map((match, index) => (
                              <div key={match.element.id || `element-${index}`} className="relative group">
                                <DroppableElement
                                  match={match}
                                  index={index}
                                  onRemoveMatch={removeMatch}
                                  isSelectedForRedaction={isElementSelectedForRedaction(match.element.id)}
                                  onSelectForRedaction={toggleElementRedaction}
                                />
                                {match.element.required && (
                                  <button
                                    onClick={() => toggleRequiredElementRemoval(match.element.id)}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 dark:bg-navy-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-navy-500 z-10"
                                    title="Remove required element"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            
                          {/* Custom elements */}
                          {customElements.map((element, index) => (
                            <DroppableCustomElement
                              key={element.id}
                              element={element}
                              index={index}
                              onRemoveMatch={removeCustomElementMatch}
                              onDelete={deleteCustomElement}
                            />
                          ))}
                          
                          {/* Add Data Element button */}
                          <button
                            onClick={addCustomElement}
                            className="flex items-center justify-center p-2 rounded-md bg-white dark:bg-navy-800 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Add Data Element
                            </span>
                          </button>
                        </div>
                        
                        {matchedElements.filter(match => !removedRequiredElements.has(match.element.id)).length === 0 && 
                         customElements.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">
                            No data elements configured
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Removed Required Elements Section - keep this as is */}
                    {removedRequiredElements.size > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Removed Required Data Elements
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {removedRequiredElements.size} removed
                            </span>
                          </h4>
                        </div>
                        <div className="p-3 max-h-[250px] overflow-y-auto">
                          <div className="grid grid-cols-1 gap-2">
                            {matchedElements
                              .filter(match => match.element.required && removedRequiredElements.has(match.element.id))
                              .map((match, index) => (
                                <div key={match.element.id || `removed-${index}`} className="relative group">
                                  <DroppableElement
                                    match={match}
                                    index={index}
                                    onRemoveMatch={removeMatch}
                                    isSelectedForRedaction={isElementSelectedForRedaction(match.element.id)}
                                    onSelectForRedaction={toggleElementRedaction}
                                  />
                                  <button
                                    onClick={() => toggleRequiredElementRemoval(match.element.id)}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-300 dark:hover:bg-amber-700 z-10"
                                    title="Restore required element"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {typeof document !== 'undefined' && createPortal(
                <DragOverlay>
                  {activeDragItem && (
                    <div className="p-2 border border-indigo-400 dark:border-indigo-600 rounded-md bg-white dark:bg-navy-800 shadow-lg">
                      <div className="flex items-center mb-1">
                        <MdDragIndicator className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                        <span className="font-medium text-sm text-navy-700 dark:text-white">
                          {activeDragItem.field.name || activeDragItem.field.label || 'Field'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate pl-6">
                        {activeDragItem.field.value || activeDragItem.field.text || 'No value'}
                      </p>
                    </div>
                  )}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          )}
        </div>
      )}
    </Card>
  );
};

export default forwardRef(DocumentControl); 