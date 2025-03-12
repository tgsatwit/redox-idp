/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
"use client";

import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiSettings, FiTrash2, FiEdit } from "react-icons/fi";
import { toast as showToast } from "./toast";
import type { IconType } from 'react-icons';

// Add these constants after the import statements
const FiTrash2Any = FiTrash2 as any;
const FiPlusAny = FiPlus as any;
const FiEditAny = FiEdit as any;

// Define interfaces
export interface Prompt {
  id: string;
  name: string;
  description: string;
  role: PromptRole;
  content: string;
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptRole = "system" | "user" | "assistant";

export interface PromptCategory {
  id: string;
  name: string;
  description: string;
  prompts: Prompt[];
  model?: string;
  temperature?: number;
  responseFormat?: {
    type: "text" | "json_object" | "json";
    schema?: string;
  };
}

// UI Components - Fixed children prop issues
const Card = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`bg-white dark:bg-navy-800 rounded-lg shadow-sm dark:shadow-gray-900/10 overflow-hidden ${className || ""}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`p-4 border-b border-gray-100 dark:border-navy-700 ${className || ""}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <h3 className={`text-lg font-medium text-gray-900 dark:text-white ${className || ""}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ""}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: any }) => (
  <div className={`p-4 ${className || ""}`} {...props}>
    {children}
  </div>
);

// Tabs components
const Tabs = ({ className, children, value, onValueChange }: { className?: string; children?: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
  <div className={`${className || ""}`} role="tablist">
    {children}
  </div>
);

const TabsList = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`flex border-b border-gray-200 dark:border-navy-700 ${className || ""}`}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, className, ...props }: { value: string; children?: React.ReactNode; className?: string; [key: string]: any }) => {
  const isActive = props.active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-2 text-sm font-medium ${
        isActive ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      } ${className || ""}`}
      onClick={() => props.onClick(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeValue, className, children }: { value: string; activeValue?: string; className?: string; children?: React.ReactNode }) => {
  if (activeValue !== value) return null;
  return (
    <div role="tabpanel" className={`py-4 ${className || ""}`}>
      {children}
    </div>
  );
};

// Button component
const Button = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className, 
  ...props 
}: { 
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500",
    outline: "border border-gray-300 dark:border-navy-600 bg-transparent hover:bg-gray-50 dark:hover:bg-navy-700/50 text-gray-700 dark:text-gray-300",
    destructive: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
  };
  
  const sizeStyles = {
    default: "h-9 px-4 py-2 rounded-md text-sm",
    sm: "h-8 px-3 rounded-md text-xs",
    lg: "h-10 px-8 rounded-md text-base"
  };
  
  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Badge component
const Badge = ({ 
  variant = 'default', 
  children, 
  className, 
  ...props 
}: { 
  variant?: 'default' | 'outline' | 'secondary';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const baseStyle = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantStyles = {
    default: "bg-brand-500/10 text-brand-500 hover:bg-brand-500/15 dark:bg-brand-500/20 dark:text-brand-400",
    outline: "text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700/50",
    secondary: "bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600"
  };
  
  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Input component
const Input = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-navy-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 focus:border-transparent ${className || ""}`}
    {...props}
  />
);

// Label component
const Label = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className || ""}`} {...props} />
);

// Spinner component
const Spinner = ({ size = 'default', className }: { size?: 'default' | 'sm' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 ${sizeClasses[size]} ${className || ""}`} />
    </div>
  );
};

// Toast notification helper
const toast = ({ title, description, variant = 'default' }: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
  // Use imported toast function
  showToast({ title, description, variant });
};

// Centralized data store for prompt config
const usePromptConfigStore = () => {
  const [state, setState] = useState({
    categories: [] as PromptCategory[],
    isLoading: false,
    isInitialized: false,
    error: null as string | null
  });

  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch prompt categories
      console.log('Fetching prompt categories...');
      const categoriesResponse = await fetch('/api/update-config/prompt-categories');
      
      if (!categoriesResponse.ok) {
        throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
      }
      
      const categories = await categoriesResponse.json();
      console.log('Loaded categories:', categories);
      
      // For each category, fetch its prompts
      for (const category of categories) {
        try {
          console.log(`Fetching prompts for category ${category.id}...`);
          const promptsResponse = await fetch(`/api/update-config/prompt-categories/${category.id}/prompts`);
          
          if (promptsResponse.ok) {
            category.prompts = await promptsResponse.json();
            console.log(`Loaded ${category.prompts.length} prompts for category ${category.id}`);
          } else {
            console.warn(`Failed to load prompts for category ${category.id}: ${promptsResponse.status}`);
            category.prompts = [];
          }
        } catch (error) {
          console.error(`Error loading prompts for category ${category.id}:`, error);
          category.prompts = [];
        }
      }
      
      setState({
        categories,
        isLoading: false,
        isInitialized: true,
        error: null
      });
    } catch (error: any) {
      console.error('Error initializing prompt config:', error);
      setState(prev => ({ 
        ...prev,
        error: error.message || 'Failed to initialize prompt configuration',
        isLoading: false 
      }));
      
      toast({
        title: "Error Loading Configuration",
        description: error.message || "Failed to load prompt configuration.",
        variant: "destructive"
      });
    }
  }, []);

  const addCategory = useCallback(async (category: Omit<PromptCategory, 'id' | 'prompts'>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/update-config/prompt-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add category: ${response.status}`);
      }
      
      const newCategory = await response.json();
      
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, { ...newCategory, prompts: [] }],
        isLoading: false
      }));
      
      return newCategory;
    } catch (error: any) {
      console.error('Error adding category:', error);
      setState(prev => ({ 
        ...prev,
        error: error.message || 'Failed to add use case',
        isLoading: false 
      }));
      
      toast({
        title: "Error Adding Use Case",
        description: error.message || "Failed to add use case.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/update-config/prompt-categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.status}`);
      }
      
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== categoryId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setState(prev => ({ 
        ...prev,
        error: error.message || 'Failed to delete use case',
        isLoading: false 
      }));
      
      toast({
        title: "Error Deleting Use Case",
        description: error.message || "Failed to delete use case.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, []);

  const addPrompt = useCallback(async (categoryId: string, prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/update-config/prompt-categories/${categoryId}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add prompt: ${response.status}`);
      }
      
      const newPrompt = await response.json();
      
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c => 
          c.id === categoryId 
            ? { ...c, prompts: [...c.prompts, newPrompt] } 
            : c
        ),
        isLoading: false
      }));
      
      return newPrompt;
    } catch (error: any) {
      console.error('Error adding prompt:', error);
      setState(prev => ({ 
        ...prev,
        error: error.message || 'Failed to add prompt',
        isLoading: false 
      }));
      
      toast({
        title: "Error Adding Prompt",
        description: error.message || "Failed to add prompt.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, []);

  const deletePrompt = useCallback(async (categoryId: string, promptId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/update-config/prompt-categories/${categoryId}/prompts/${promptId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete prompt: ${response.status}`);
      }
      
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c => 
          c.id === categoryId 
            ? { ...c, prompts: c.prompts.filter(p => p.id !== promptId) } 
            : c
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting prompt:', error);
      setState(prev => ({ 
        ...prev,
        error: error.message || 'Failed to delete prompt',
        isLoading: false 
      }));
      
      toast({
        title: "Error Deleting Prompt",
        description: error.message || "Failed to delete prompt.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, []);

  return {
    ...state,
    initialize,
    addCategory,
    deleteCategory,
    addPrompt,
    deletePrompt
  };
};

// Begin UseCaseSettings component
const UseCaseSettings = ({ category }: { category: PromptCategory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategory, setEditedCategory] = useState({
    name: category.name,
    description: category.description,
    model: category.model || 'Default',
    temperature: category.temperature || 1.0,
  });

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={editedCategory.name}
              onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
              placeholder="Use case name"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={editedCategory.description}
              onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-3">Advanced Settings</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editedCategory.model}
                  onChange={(e) => setEditedCategory({ ...editedCategory, model: e.target.value })}
                  placeholder="Default"
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={editedCategory.temperature}
                  onChange={(e) => setEditedCategory({ ...editedCategory, temperature: parseFloat(e.target.value) })}
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/update-config/prompt-categories/${category.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: editedCategory.name,
                      description: editedCategory.description,
                      model: editedCategory.model === 'Default' ? undefined : editedCategory.model,
                      temperature: editedCategory.temperature,
                    }),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to update use case');
                  }
                  // Optionally refresh data here
                  setIsEditing(false);
                  toast({ title: 'Success', description: 'Use case updated successfully', variant: 'default' });
                } catch (error) {
                  console.error('Error updating use case:', error);
                  toast({ title: 'Error', description: 'Failed to update use case', variant: 'destructive' });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <div className="p-2 bg-gray-50 dark:bg-navy-700/80 rounded-md text-gray-900 dark:text-gray-100">
              {category.name}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="p-2 bg-gray-50 dark:bg-navy-700/80 rounded-md text-gray-900 dark:text-gray-100">
              {category.description}
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-3 dark:text-gray-300">Advanced Settings</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <div className="p-2 bg-gray-50 dark:bg-navy-700/80 rounded-md text-gray-900 dark:text-gray-100">
                  {category.model || 'Default'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Temperature</Label>
                <div className="p-2 bg-gray-50 dark:bg-navy-700/80 rounded-md text-gray-900 dark:text-gray-100">
                  {category.temperature || 'Default (1.0)'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <FiEditAny size={14} className="mr-1" />
              Edit Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
// End UseCaseSettings component

export default function PromptsConfigPage() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [addPromptPreselectedRole, setAddPromptPreselectedRole] = useState<PromptRole | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState("prompts");
  
  // Use our store for data fetching
  const { 
    categories: storeCategories, 
    isLoading: storeIsLoading, 
    error: storeError, 
    initialize, 
    addCategory, 
    deleteCategory, 
    addPrompt, 
    deletePrompt 
  } = usePromptConfigStore();
  
  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Set the first category as selected if none is selected
  useEffect(() => {
    if (storeCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(storeCategories[0]?.id || null);
    }
  }, [storeCategories, selectedCategory]);

  const handleAddCategory = async (category: Omit<PromptCategory, 'id' | 'prompts'>) => {
    try {
      await addCategory(category);
      setShowAddCategoryModal(false);
      toast({
        title: "Success",
        description: "Use case added successfully"
      });
    } catch (error) {
      // Error already handled in the store
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this use case?")) {
      return;
    }
    
    try {
      await deleteCategory(categoryId);
      
      if (selectedCategory === categoryId) {
        setSelectedCategory(storeCategories.length > 0 ? storeCategories[0]?.id : null);
        setSelectedPrompt(null);
      }
      
      toast({
        title: "Success",
        description: "Use case deleted successfully"
      });
    } catch (error) {
      // Error already handled in the store
    }
  };

  const handleAddPrompt = async (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedCategory) return;
    
    try {
      await addPrompt(selectedCategory, prompt);
      setShowAddPromptModal(false);
      toast({
        title: "Success",
        description: "Prompt added successfully"
      });
    } catch (error) {
      // Error already handled in the store
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!selectedCategory || !window.confirm("Are you sure you want to delete this prompt?")) {
      return;
    }
    
    try {
      await deletePrompt(selectedCategory, promptId);
      
      if (selectedPrompt === promptId) {
        setSelectedPrompt(null);
      }
      
      toast({
        title: "Success",
        description: "Prompt deleted successfully"
      });
    } catch (error) {
      // Error already handled in the store
    }
  };

  const getSelectedCategoryPrompts = () => {
    return storeCategories.find(c => c.id === selectedCategory)?.prompts || [];
  };

  const getSelectedPrompt = () => {
    return getSelectedCategoryPrompts().find(p => p.id === selectedPrompt);
  };

  // Handle loading state
  if (storeIsLoading && storeCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
        <p className="ml-4 text-gray-500 dark:text-gray-400">Loading prompt configuration...</p>
      </div>
    );
  }

  // Handle error state
  if (storeError && storeCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2 text-center">Error Loading Configuration</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-center mb-4">{storeError}</p>
        <Button onClick={initialize}>
          Retry
        </Button>
      </div>
    );
  }

  const IconWithMargin = ({ icon: Icon, ...props }: { icon: IconType; [key: string]: any }) => (
    <span className="mr-2">
      {(Icon as any)({ size: 16, ...props })}
    </span>
  );
  
  return (
    <div className="p-6 dark:bg-navy-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Prompt Use Cases List (Categories) - 3 cols */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Prompt Use Cases</CardTitle>
            <CardDescription>Select a use case to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {storeCategories.map(category => (
                <div 
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                    selectedCategory === category.id 
                      ? 'bg-gray-100 dark:bg-navy-700 shadow-md border-l-4 border-l-brand-500 dark:border-l-brand-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-navy-700 bg-gray-50 dark:bg-navy-700/80'
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedPrompt(null);
                  }}
                >
                  <div>
                    <p className={`font-medium ${selectedCategory === category.id ? 'text-brand-800 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{category.name}</p>
                    <p className={`text-xs ${selectedCategory === category.id ? 'text-brand-600 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {category.prompts?.length || 0} prompts
                    </p>
                  </div>
                  <button
                    className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-navy-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <FiTrash2Any size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              ))}
              
              {storeCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No use cases found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowAddCategoryModal(true)}
                  >
                    Create one
                  </Button>
                </div>
              )}
              
              {/* Add divider and Add Use Case button */}
              {storeCategories.length > 0 && (
                <div className="pt-2">
                  <div className="h-px bg-gray-200 dark:bg-navy-700 my-2"></div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full justify-center mt-1"
                    onClick={() => setShowAddCategoryModal(true)}
                  >
                    <IconWithMargin icon={FiPlusAny} />
                    Add Use Case
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {selectedCategory ? (
          <>
            {/* Main Content Area - 6 cols */}
            <div className="md:col-span-6">
              <Card>
                <CardHeader className="border-b border-gray-100 dark:border-navy-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {storeCategories.find(c => c.id === selectedCategory)?.name || 'Use Case'}
                      </CardTitle>
                      <CardDescription>
                        {storeCategories.find(c => c.id === selectedCategory)?.description || 'Manage prompts for this use case'}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowAddPromptModal(true)}
                      disabled={!selectedCategory}
                    >
                      <IconWithMargin icon={FiPlusAny} />
                      Add Prompt
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Available Prompts Section */}
                  <div className="p-4 border-b border-gray-100 dark:border-navy-700/50">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Available Prompts</h3>
                    
                    {/* Horizontal row of prompt types */}
                    <div className="flex flex-wrap gap-3">
                      {(['system', 'user', 'assistant'] as PromptRole[]).map(role => {
                        const promptsOfRole = getSelectedCategoryPrompts().filter(p => p.role === role);
                        const isConfigured = promptsOfRole.length > 0;
                        const activePrompt = promptsOfRole.find(p => p.isActive);
                        
                        return (
                          <div 
                            key={role}
                            className={`flex-1 min-w-[150px] p-3 rounded-md ${
                              selectedPrompt && getSelectedPrompt()?.role === role
                                ? 'bg-gray-100 dark:bg-navy-700 shadow-md border-l-4 border-l-brand-500 dark:border-l-brand-400' 
                                : 'border-0'
                            } ${
                              isConfigured 
                                ? 'bg-gray-50 dark:bg-navy-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700'
                                : 'bg-gray-50 dark:bg-navy-700/80 text-gray-500 dark:text-gray-400'
                            }`}
                            onClick={() => {
                              if (isConfigured && activePrompt) {
                                setSelectedPrompt(activePrompt.id);
                              } else if (isConfigured && promptsOfRole[0]) {
                                setSelectedPrompt(promptsOfRole[0].id);
                              } else {
                                // Open add prompt modal with pre-selected role
                                setAddPromptPreselectedRole(role);
                                setShowAddPromptModal(true);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={isConfigured ? 'default' : 'secondary'} className="capitalize">
                                {role}
                              </Badge>
                              {isConfigured && (
                                <Badge variant="default" className="text-xs text-white dark:text-white font-medium bg-green-500/90 dark:bg-green-500/90">
                                  Active
                                </Badge>
                              )}
                            </div>
                            
                            {isConfigured ? (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {activePrompt?.name || promptsOfRole[0]?.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {promptsOfRole.length} {promptsOfRole.length === 1 ? 'version' : 'versions'}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mt-2">
                                <p className="text-sm">No {role} prompt configured</p>
                                <FiPlusAny size={14} className="ml-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Selected Prompt Detail or Empty State */}
                  {selectedPrompt ? (
                    <div className="p-4">
                      {(() => {
                        const prompt = getSelectedPrompt();
                        if (!prompt) return null;
                        
                        return (
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex gap-3 mb-2">
                                  <Badge variant="outline" className="capitalize">{prompt.role}</Badge>
                                  {prompt.isActive && (
                                    <Badge variant="default" className="capitalize bg-green-500/90 dark:bg-green-500/90 text-white dark:text-white">Active</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Enable editing for this prompt
                                    setEditingPrompt({
                                      id: prompt.id,
                                      name: prompt.name,
                                      description: prompt.description,
                                      content: prompt.content,
                                      role: prompt.role,
                                      isActive: prompt.isActive,
                                      category: prompt.category,
                                      createdAt: prompt.createdAt,
                                      updatedAt: prompt.updatedAt
                                    });
                                  }}
                                >
                                  <FiEditAny size={14} className="mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeletePrompt(prompt.id)}
                                >
                                  <FiTrash2Any size={14} className="mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm block mb-2">Content</Label>
                              <div className="bg-gray-50 dark:bg-navy-700/80 rounded-md p-3 font-mono text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                {prompt.content}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-3">
                        {getSelectedCategoryPrompts().length > 0 
                          ? 'Select a prompt to view details'
                          : 'No prompts configured for this use case'
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowAddPromptModal(true)}
                      >
                        <IconWithMargin icon={FiPlusAny} />
                        Add your first prompt
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Settings Card - 3 cols */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Use Case Settings</CardTitle>
                <CardDescription>Configure settings for this prompt use case</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCategory && storeCategories.find(c => c.id === selectedCategory) ? (
                  <UseCaseSettings category={storeCategories.find(c => c.id === selectedCategory)!} />
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="md:col-span-9">
            <div className="flex flex-col items-center justify-center p-8">
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">No Use Case Selected</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Select a use case from the list or create a new one</p>
              <Button onClick={() => setShowAddCategoryModal(true)}>
                <IconWithMargin icon={FiPlusAny} />
                Add Use Case
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Modal placeholders with dark mode support */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 p-6 rounded-lg w-full max-w-md shadow-xl dark:shadow-black/40">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add Prompt Use Case</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter use case name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Enter use case description" className="mt-1" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>Cancel</Button>
                <Button onClick={() => {
                  const name = (document.getElementById('name') as HTMLInputElement).value;
                  const description = (document.getElementById('description') as HTMLInputElement).value;
                  if (name) {
                    handleAddCategory({ name, description });
                  }
                }}>
                  Add Use Case
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddPromptModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-800 p-6 rounded-lg w-full max-w-md shadow-xl dark:shadow-black/40">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add Prompt</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="promptName">Name</Label>
                <Input id="promptName" placeholder="Enter prompt name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="promptDescription">Description</Label>
                <Input id="promptDescription" placeholder="Enter prompt description" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="promptRole">Role</Label>
                <select 
                  id="promptRole" 
                  className="flex h-9 w-full rounded-md border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm mt-1"
                >
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>
              <div>
                <Label htmlFor="promptContent">Content</Label>
                <textarea 
                  id="promptContent" 
                  className="flex h-32 w-full rounded-md border border-gray-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm mt-1"
                  placeholder="Enter prompt content"
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="promptActive" className="rounded text-brand-500 border-gray-300 dark:border-navy-700" defaultChecked />
                <Label htmlFor="promptActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddPromptModal(false)}>Cancel</Button>
                <Button onClick={() => {
                  const name = (document.getElementById('promptName') as HTMLInputElement).value;
                  const description = (document.getElementById('promptDescription') as HTMLInputElement).value;
                  const role = (document.getElementById('promptRole') as HTMLSelectElement).value as PromptRole;
                  const content = (document.getElementById('promptContent') as HTMLTextAreaElement).value;
                  const isActive = (document.getElementById('promptActive') as HTMLInputElement).checked;
                  
                  if (name && content) {
                    handleAddPrompt({ 
                      name, 
                      description, 
                      role, 
                      content, 
                      isActive, 
                      category: selectedCategory || ''
                    });
                  }
                }}>
                  Add Prompt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
