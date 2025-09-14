"use client";

import { useState, useEffect } from 'react';
import { 
  ComprehendClient, 
  ListDocumentClassifiersCommand,
  ListEntityRecognizersCommand,
  DescribeDocumentClassifierCommand,
  DescribeEntityRecognizerCommand,
} from "@aws-sdk/client-comprehend";
import { 
  DynamoDBClient, 
  ScanCommand 
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw, FiSettings } from "react-icons/fi";

// Import only the components we need
import Card from '@/components/card';

// Define interfaces for our data structures
interface ClassificationFeedback {
  id: string;
  documentId: string;
  originalClassification: {
    documentType: string;
    confidence: number;
  } | null;
  correctedDocumentType: string | null;
  documentSubType?: string;
  feedbackSource: 'auto' | 'manual' | 'review';
  timestamp: number;
  hasBeenUsedForTraining: boolean;
  status?: 'pending' | 'reviewed' | 'corrected';
}

interface FeedbackStats {
  total: number;
  trained: number;
  untrained: number;
  byDocumentType: Record<string, {
    total: number;
    trained: number;
    untrained: number;
    bySubType: Record<string, {
      total: number;
      trained: number;
      untrained: number;
    }>;
  }>;
}

interface ModelSummary {
  name: string;
  status: string;
  created: Date;
  version: string;
  accuracy?: number;
  datasetSize?: number;
  lastTraining?: Date;
  isActive: boolean;
}

// Helper functions
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'trained':
    case 'active':
    case 'in_service':
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50">Active</span>;
    case 'training':
    case 'submitted':
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">Training</span>;
    case 'stopped':
    case 'stop_requested':
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50">Stopped</span>;
    case 'failed':
    case 'error':
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50">Failed</span>;
    default:
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{status}</span>;
  }
};

const formatDate = (date: Date | number | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Component for the model cards
const ModelCard = ({ model, type }: { model: ModelSummary, type: 'classifier' | 'entity' }) => {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-navy-700/50 transition duration-200 hover:shadow-md">
      <div className="flex justify-between items-start pb-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{model.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Version: {model.version} • Created: {formatDate(model.created)}</p>
        </div>
        {getStatusBadge(model.status)}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dataset Size</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.datasetSize?.toLocaleString() || 'N/A'}</p>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Training</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(model.lastTraining)}</p>
      </div>
      <div className="flex gap-2 w-full pt-2 border-t border-gray-100 dark:border-navy-700/50">
        <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-navy-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 flex-1 transition-colors">
          <FiSettings className="mr-1 h-4 w-4" /> Details
        </button>
        <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white flex-1 transition-colors">
          <FiRefreshCw className="mr-1 h-4 w-4" /> Retrain
        </button>
      </div>
    </div>
  );
};

// FeedbackTable wrapper component to customize MostVisited for our needs
const FeedbackTable = ({ data }: { data: any[] }) => {
  // Custom data transformation to match the required format but with our own headers
  const tableData = data.map(item => ({
    pageName: item.pageName, // Keep this as is for compatibility
    visitors: item.visitors, // Keep this as is for compatibility
    unique: item.unique, // Keep this as is for compatibility
    clients: item.clients, // Keep this as is for compatibility
    bounceRate: item.bounceRate // Keep this as is for compatibility
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm w-full">
        <div className="h-full w-full pt-3 pb-10 px-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Classification Feedback
            </p>
            <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-gray-700 dark:text-gray-300 transition-colors">
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
          
          <div className="mt-4 overflow-x-scroll xl:overflow-x-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-navy-700">
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Document ID</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Original Type</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Corrected Type</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Timestamp</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Training Status</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-navy-700/50 hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{item.pageName}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{item.visitors}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{item.unique}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{item.clients}</td>
                      <td className="py-3 px-4 text-sm">
                        {item.bounceRate.startsWith('+') ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Trained
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Untrained
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                      No feedback data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom chart components with data from our application
const DocumentTypeChart = ({ data }: { data: any[] }) => {
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  // Limit to top 5 document types
  const topDocTypes = sortedData.slice(0, 5);
  
  // Get the maximum value for scaling
  const maxValue = topDocTypes.length > 0 
    ? Math.max(...topDocTypes.map(item => item.value)) 
    : 0;
    
  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm h-full border border-gray-100 dark:border-navy-700/50">
      <div className="p-4 border-b border-gray-100 dark:border-navy-700/50">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Feedback by Document Type</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of feedback across document types</p>
      </div>
      <div className="h-[300px] p-4 overflow-hidden">
        {data.length > 0 ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 mt-2">
              {topDocTypes.map((item, index) => {
                const percentage = maxValue ? (item.value / maxValue) * 100 : 0;
                return (
                  <div key={index} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                        {item.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.value} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2.5">
                      <div 
                        className="bg-brand-500 dark:bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {item.extra && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.extra}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Show total count */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-navy-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Feedback</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.reduce((sum, item) => sum + item.value, 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No document type data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainingStatusChart = ({ data }: { data: any[] }) => {
  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const trainedPercentage = total ? Math.round((data[0]?.value / total) * 100) : 0;
  
  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm h-full border border-gray-100 dark:border-navy-700/50">
      <div className="p-4 border-b border-gray-100 dark:border-navy-700/50">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Training Status</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ratio of used vs. unused feedback</p>
      </div>
      <div className="h-[300px] p-4 overflow-hidden">
        {data.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Custom donut chart */}
            <div className="relative h-[140px] w-[140px] mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[120px] w-[120px] rounded-full border-[16px] border-brand-500 dark:border-brand-600"></div>
                <div 
                  className="absolute inset-0 rounded-full border-[16px] border-gray-200 dark:border-navy-700" 
                  style={{ 
                    clipPath: `polygon(50% 50%, 50% 0%, ${trainedPercentage < 50 
                      ? `${100 - trainedPercentage * 3.6}% 0%` 
                      : '100% 0%, 100% 100%, 0% 100%, 0% 0%'})` 
                  }}
                ></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{trainedPercentage}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trained</p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-brand-500 dark:bg-brand-600 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Trained</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-navy-700 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Untrained</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Trained</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{data[0]?.value || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Untrained</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{data[1]?.value || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No training status data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component for the training configuration page
export default function TrainingConfigPage() {
  // State for classifier models
  const [classifierModels, setClassifierModels] = useState<ModelSummary[]>([]);
  const [entityModels, setEntityModels] = useState<ModelSummary[]>([]);
  const [feedbackData, setFeedbackData] = useState<ClassificationFeedback[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('models');

  // Mock data for initial UI development - would be replaced with actual API calls
  const mockClassifierModels: ModelSummary[] = [
    {
      name: "Invoice Classifier",
      status: "TRAINED",
      created: new Date(2023, 5, 15),
      version: "v1.3",
      accuracy: 0.92,
      datasetSize: 5240,
      lastTraining: new Date(2023, 8, 10),
      isActive: true
    },
    {
      name: "Medical Document Classifier",
      status: "TRAINING",
      created: new Date(2023, 9, 5),
      version: "v0.9",
      datasetSize: 3150,
      lastTraining: new Date(2023, 9, 5),
      isActive: false
    }
  ];

  const mockEntityModels: ModelSummary[] = [
    {
      name: "Financial Entity Recognizer",
      status: "TRAINED",
      created: new Date(2023, 4, 20),
      version: "v2.1",
      accuracy: 0.89,
      datasetSize: 3800,
      lastTraining: new Date(2023, 7, 15),
      isActive: true
    }
  ];

  // Prepare data for the dashboard components
  const prepareChartData = () => {
    if (!feedbackStats) return {
      documentTypes: [],
      trainingStatus: [
        { name: "Trained", value: 0 },
        { name: "Untrained", value: 100 }
      ]
    };
    
    // Data for document type distribution
    const documentTypes = Object.entries(feedbackStats.byDocumentType).map(([docType, data]) => ({
      name: docType,
      value: data.total,
      extra: `${data.trained} trained, ${data.untrained} untrained`
    }));

    // Data for training status pie chart
    const trainingStatus = [
      { name: "Trained", value: feedbackStats.trained },
      { name: "Untrained", value: feedbackStats.untrained }
    ];
    
    return { documentTypes, trainingStatus };
  };

  // Data for charts
  const chartData = prepareChartData();

  // Prepare tableData format for FeedbackTable component
  const prepareFeedbackTableData = () => {
    if (!feedbackData || feedbackData.length === 0) {
      return [];
    }
    
    return feedbackData.slice(0, 10).map((feedback) => ({
      pageName: feedback.documentId.substring(0, 20) + (feedback.documentId.length > 20 ? '...' : ''),
      visitors: feedback.originalClassification?.documentType || 'Unknown',
      unique: feedback.correctedDocumentType || 'N/A',
      clients: formatTimestamp(feedback.timestamp),
      bounceRate: feedback.hasBeenUsedForTraining ? '+100%' : '0%' // Ensuring this is a string with + or - prefix
    }));
  };

  // Fetch data from AWS and DynamoDB
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call AWS Comprehend API
        // For now, using mock data for UI development
        setClassifierModels(mockClassifierModels);
        setEntityModels(mockEntityModels);

        // Fetch classification feedback from DynamoDB
        await fetchClassificationFeedback();
        
        // Fetch feedback statistics
        await fetchFeedbackStats();
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load model data. Please check your AWS credentials and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to fetch classification feedback from DynamoDB
  const fetchClassificationFeedback = async () => {
    try {
      const response = await fetch('/api/train-models/classification-feedback', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classification feedback');
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (err) {
      console.error("Error fetching classification feedback:", err);
      setError("Failed to load feedback data from DynamoDB.");
    }
  };

  // Function to fetch feedback statistics
  const fetchFeedbackStats = async () => {
    try {
      const response = await fetch('/api/train-models/classification-feedback/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback statistics');
      }

      const stats = await response.json();
      setFeedbackStats(stats);
    } catch (err) {
      console.error("Error fetching feedback statistics:", err);
    }
  };

  // Tab components
  const TabButton = ({ label, value }: { label: string, value: string }) => (
    <button
      className={`px-4 py-2 font-medium rounded-md transition-all duration-200 ${
        activeTab === value
          ? 'bg-brand-500 text-white dark:bg-brand-600 dark:text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700'
      }`}
      onClick={() => setActiveTab(value)}
    >
      {label}
    </button>
  );

  // Stat Card component
  const StatCard = ({ title, value, subtext }: { title: string, value: string | number, subtext: string }) => (
    <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-navy-700/50 transition duration-200 hover:shadow-md">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
    </div>
  );

  return (
    <div className="p-6 dark:bg-navy-900 min-h-screen">

      {error && (
        <div className="mb-6 p-4 border rounded-lg bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Error</h3>
          </div>
          <p className="mt-1 ml-7">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 p-1 bg-gray-100 dark:bg-navy-800 rounded-lg w-fit">
        <TabButton label="Comprehend Models" value="models" />
        <TabButton label="Classification Feedback" value="feedback" />
        <TabButton label="Training Flywheels" value="flywheels" />
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="mt-3 grid h-full grid-cols-1 gap-6">
          <div className="col-span-1">
            <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-100 dark:border-navy-700/50">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Document Classifier Models</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Custom document classification models trained with AWS Comprehend
                  </p>
                </div>
                <button className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <FiRefreshCw className="h-4 w-4" /> Create New Classifier
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoading ? (
                    <p className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">Loading classifier models...</p>
                  ) : classifierModels.length > 0 ? (
                    classifierModels.map((model, idx) => (
                      <div key={idx} className="bg-white dark:bg-navy-700/60 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-navy-600 transition duration-200 hover:shadow-md">
                        <div className="flex justify-between items-start pb-2">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{model.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Version: {model.version} • Created: {formatDate(model.created)}</p>
                          </div>
                          {getStatusBadge(model.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 my-3">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Dataset Size</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.datasetSize?.toLocaleString() || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Training</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(model.lastTraining)}</p>
                        </div>
                        <div className="mt-4 flex gap-2 pt-2 border-t border-gray-100 dark:border-navy-700/50">
                          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-navy-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 flex-1 transition-colors">
                            <FiSettings className="mr-1 h-4 w-4" /> Details
                          </button>
                          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white flex-1 transition-colors">
                            <FiRefreshCw className="mr-1 h-4 w-4" /> Retrain
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">No classifier models found</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-100 dark:border-navy-700/50">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Entity Recognition Models</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Custom entity recognition models trained with AWS Comprehend
                  </p>
                </div>
                <button className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <FiRefreshCw className="h-4 w-4" /> Create New Entity Recognizer
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoading ? (
                    <p className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">Loading entity models...</p>
                  ) : entityModels.length > 0 ? (
                    entityModels.map((model, idx) => (
                      <div key={idx} className="bg-white dark:bg-navy-700/60 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-navy-600 transition duration-200 hover:shadow-md">
                        <div className="flex justify-between items-start pb-2">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{model.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Version: {model.version} • Created: {formatDate(model.created)}</p>
                          </div>
                          {getStatusBadge(model.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 my-3">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Dataset Size</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{model.datasetSize?.toLocaleString() || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Training</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(model.lastTraining)}</p>
                        </div>
                        <div className="mt-4 flex gap-2 pt-2 border-t border-gray-100 dark:border-navy-700/50">
                          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-navy-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 flex-1 transition-colors">
                            <FiSettings className="mr-1 h-4 w-4" /> Details
                          </button>
                          <button className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white flex-1 transition-colors">
                            <FiRefreshCw className="mr-1 h-4 w-4" /> Retrain
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">No entity recognition models found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats Cards - Top Row */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              title="Total Feedback" 
              value={feedbackStats?.total || 0} 
              subtext="Document classification feedback entries" 
            />
            
            <StatCard 
              title="Used for Training" 
              value={feedbackStats?.trained || 0}
              subtext={`${feedbackStats && feedbackStats.total > 0 ? ((feedbackStats.trained / feedbackStats.total) * 100).toFixed(1) : 0}% of total feedback`}
            />
            
            <StatCard 
              title="Untrained Feedback" 
              value={feedbackStats?.untrained || 0}
              subtext={`${feedbackStats && feedbackStats.total > 0 ? ((feedbackStats.untrained / feedbackStats.total) * 100).toFixed(1) : 0}% of total feedback`}
            />
            
            <StatCard 
              title="Manual Corrections" 
              value={feedbackData.filter(f => f.feedbackSource === 'manual').length}
              subtext={`${feedbackStats && feedbackStats.total > 0 ? 
                ((feedbackData.filter(f => f.feedbackSource === 'manual').length / feedbackStats.total) * 100).toFixed(1) : 0}% of total feedback`}
            />
          </div>
          
          {/* Charts - Middle Row */}
          <div className="lg:col-span-8">
            <DocumentTypeChart data={chartData.documentTypes} />
          </div>
          
          {/* Training Status Chart */}
          <div className="lg:col-span-4">
            <TrainingStatusChart data={chartData.trainingStatus} />
          </div>
          
          {/* Feedback Table - Bottom Row */}
          <div className="lg:col-span-12">
            {isLoading ? (
              <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50 p-8">
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">Loading feedback data...</p>
              </div>
            ) : feedbackData.length > 0 ? (
              <FeedbackTable data={prepareFeedbackTableData()} />
            ) : (
              <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50 p-8">
                <p className="text-center py-4 text-gray-500 dark:text-gray-400">No feedback data available</p>
              </div>
            )}
            
            {feedbackData.length > 10 && (
              <div className="mt-4 text-center">
                <button className="px-4 py-2 font-medium rounded-md border border-brand-500/30 dark:border-brand-400/30 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                  View All ({feedbackData.length}) Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flywheels Tab */}
      {activeTab === 'flywheels' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50">
            <div className="p-4 border-b border-gray-100 dark:border-navy-700/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Document Classification Flywheel</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Continuous improvement pipeline for document classifiers
              </p>
            </div>
            <div className="p-4">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Training Progress</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-navy-700 rounded-full h-2">
                  <div className="bg-brand-500 dark:bg-brand-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-navy-700/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <FiClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Training</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">3 days ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-navy-700/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                      <FiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accuracy Gain</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">+3.5%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-navy-700/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                      <FiRefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Training Frequency</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Weekly</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Flywheel Steps</h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Collect Classification Feedback</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          System automatically collects classification decisions and corrections
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Prepare Training Datasets</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Format feedback into AWS Comprehend compatible datasets
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Train New Model Version</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Create a new classifier model with the combined dataset
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Evaluate & Deploy</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Test the model accuracy and deploy to production if improved
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-navy-700/50 flex justify-between">
              <button className="px-4 py-2 font-medium rounded-md border border-gray-300 dark:border-navy-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                Configure Flywheel
              </button>
              <button className="px-4 py-2 font-medium rounded-md bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-colors">
                Start Manual Training
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700/50">
            <div className="p-4 border-b border-gray-100 dark:border-navy-700/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Entity Recognition Flywheel</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Continuous improvement pipeline for custom entity recognizers
              </p>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-center">
                <div className="text-center max-w-md">
                  <FiSettings className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Entity Recognition Flywheel Not Configured</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Set up an automated training pipeline for your custom entity recognition models to continuously improve accuracy.
                  </p>
                  <button className="px-4 py-2 font-medium rounded-md bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-colors">
                    Configure Entity Recognition Flywheel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
