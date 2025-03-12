import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id } from '@/types/hui-types';

// Types from DocumentControl
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

// Store state type
interface DocumentProcessingState {
  // Document identifiers
  documentTypeId: string | null;
  documentSubTypeId: string | null;
  
  // Matches between elements and fields
  matchedElements: Array<{
    element: DocumentElement;
    field: ExtractedField | null;
    matched: boolean;
  }>;
  
  // Redaction configuration
  redactedElements: Set<string>;
  redactedFields: Set<string>;
  
  // Required elements that have been removed
  removedRequiredElements: Set<string>;
  
  // Custom elements
  customElements: Array<{
    id: string;
    field: ExtractedField | null;
    matched: boolean;
  }>;
  
  // Actions
  setDocumentInfo: (documentTypeId: string | null, documentSubTypeId: string | null) => void;
  setMatchedElements: (matchedElements: Array<{
    element: DocumentElement;
    field: ExtractedField | null;
    matched: boolean;
  }>) => void;
  updateMatchedElement: (elementId: string, field: ExtractedField | null, matched: boolean) => void;
  toggleRedactedElement: (elementId: string) => void;
  toggleRedactedField: (fieldId: string) => void;
  toggleRequiredElementRemoval: (elementId: string) => void;
  setCustomElements: (customElements: Array<{
    id: string;
    field: ExtractedField | null;
    matched: boolean;
  }>) => void;
  updateCustomElement: (customElementId: string, field: ExtractedField | null, matched: boolean) => void;
  addCustomElement: () => void;
  deleteCustomElement: (customElementId: string) => void;
  resetState: () => void;
}

// Helper for converting Set to array and back for persistence
// Sets cannot be directly serialized to JSON
const setToArray = <T>(set: Set<T>): T[] => Array.from(set);
const arrayToSet = <T>(array: T[] | undefined): Set<T> => new Set(array || []);

// Create the store with persistence
export const useDocumentProcessingStore = create<DocumentProcessingState>()(
  persist(
    (set) => ({
      // Initial state
      documentTypeId: null,
      documentSubTypeId: null,
      matchedElements: [],
      redactedElements: new Set(),
      redactedFields: new Set(),
      removedRequiredElements: new Set(),
      customElements: [],
      
      // Actions
      setDocumentInfo: (documentTypeId, documentSubTypeId) => 
        set({ documentTypeId, documentSubTypeId }),
      
      setMatchedElements: (matchedElements) => 
        set({ matchedElements }),
      
      updateMatchedElement: (elementId, field, matched) => 
        set((state) => ({
          matchedElements: state.matchedElements.map((match) => 
            match.element.id === elementId 
              ? { ...match, field, matched } 
              : match
          ),
        })),
      
      toggleRedactedElement: (elementId) =>
        set((state) => {
          const newSet = new Set(state.redactedElements);
          if (newSet.has(elementId)) {
            newSet.delete(elementId);
          } else {
            newSet.add(elementId);
          }
          return { redactedElements: newSet };
        }),
      
      toggleRedactedField: (fieldId) =>
        set((state) => {
          const newSet = new Set(state.redactedFields);
          if (newSet.has(fieldId)) {
            newSet.delete(fieldId);
          } else {
            newSet.add(fieldId);
          }
          return { redactedFields: newSet };
        }),
      
      toggleRequiredElementRemoval: (elementId) =>
        set((state) => {
          const newSet = new Set(state.removedRequiredElements);
          if (newSet.has(elementId)) {
            newSet.delete(elementId);
          } else {
            newSet.add(elementId);
          }
          return { removedRequiredElements: newSet };
        }),
      
      setCustomElements: (customElements) => 
        set({ customElements }),
      
      updateCustomElement: (customElementId, field, matched) => 
        set((state) => ({
          customElements: state.customElements.map((element) => 
            element.id === customElementId 
              ? { ...element, field, matched } 
              : element
          ),
        })),
      
      addCustomElement: () => 
        set((state) => ({
          customElements: [
            ...state.customElements, 
            {
              id: `custom-element-${Date.now()}`,
              field: null,
              matched: false
            }
          ]
        })),
      
      deleteCustomElement: (customElementId) => 
        set((state) => ({
          customElements: state.customElements.filter(
            (element) => element.id !== customElementId
          ),
        })),
      
      resetState: () => 
        set({
          matchedElements: [],
          redactedElements: new Set(),
          redactedFields: new Set(),
          removedRequiredElements: new Set(),
          customElements: [],
        }),
    }),
    {
      name: 'document-processing-storage',
      // Custom serialization for Sets since they are not directly JSON-serializable
      partialize: (state) => ({
        ...state,
        redactedElements: setToArray(state.redactedElements),
        redactedFields: setToArray(state.redactedFields),
        removedRequiredElements: setToArray(state.removedRequiredElements),
      }),
      // Custom merge function to convert arrays back to Sets
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as any;
        return {
          ...currentState,
          ...typedPersistedState,
          // Convert arrays back to Sets
          redactedElements: arrayToSet(typedPersistedState.redactedElements),
          redactedFields: arrayToSet(typedPersistedState.redactedFields),
          removedRequiredElements: arrayToSet(typedPersistedState.removedRequiredElements),
        };
      },
    }
  )
); 