'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  MdDocumentScanner,
  MdOutlineWorkspaces,
  MdErrorOutline,
  MdInsights,
  MdAdd,
  MdSettings,
  MdApi,
  MdWifiTethering,
  MdPeople,
  MdOutlineAnalytics,
  MdLocationOn,
  MdStorage
} from 'react-icons/md';
import { FaRegFileAlt, FaNetworkWired, FaRobot, FaRegClock } from 'react-icons/fa';
import ProcessDocument from '@/components/admin/dashboards/idp-dashboard/ProcessDocument';
import WorkflowManagement from '@/components/admin/dashboards/idp-dashboard/WorkflowManagement';

/**
 * Types for dashboard tiles and their properties
 */
type DashboardTileProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  bgColor: string;
  iconColor: string;
};

/**
 * Card component that follows the smart home dashboard style
 */
const DashboardCard = ({ title, location, children, className = "" }: {
  title?: string;
  location?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`rounded-xl bg-navy-800 border border-navy-700 overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-navy-700 flex justify-between items-center">
          <h3 className="text-base font-medium text-white">{title}</h3>
          {location && (
            <div className="flex items-center text-gray-400 text-sm">
              <MdLocationOn className="mr-1 text-gray-500" size={16} />
              <span>{location}</span>
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

/**
 * Status indicator component (ON/OFF)
 */
const StatusIndicator = ({ label, status, icon }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-navy-700 rounded-full p-3 mb-3">
        {icon}
      </div>
      <div className="text-gray-400 text-xs mb-1">{label}:</div>
      <div className={`text-sm font-medium ${status === 'ON' ? 'text-green-400' : 'text-gray-500'}`}>
        {status}
      </div>
    </div>
  );
};

/**
 * QuickAction button styled like smart home controls
 */
const QuickActionButton = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  badge = null,
  activeColor = "text-blue-400",
  activeBg = "bg-navy-700",
  href = null
}) => {
  const buttonContent = (
    <>
      <div className="text-3xl mb-3">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </>
  );

  const className = `relative p-4 rounded-xl flex flex-col items-center justify-center min-h-[100px] transition-colors ${
    isActive ? 
    `${activeBg} ${activeColor} border border-blue-500/30` : 
    'bg-navy-800 border border-navy-700 text-gray-400 hover:border-navy-600'
  }`;

  if (href) {
    return (
      <Link 
        href={href}
        className={className}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={className}
    >
      {buttonContent}
    </button>
  );
};

/**
 * Main IDP Dashboard Page component
 */
const IDPDashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Handle quick actions that display components directly in the dashboard
  const handleQuickAction = (action: string) => {
    setActiveComponent(action);
  };

  // Quick action configurations
  const quickActions = [
    {
      id: 'processSingle',
      label: 'Process Document',
      icon: <MdDocumentScanner />,
    },
    {
      id: 'storeDocuments',
      label: 'Store Documents',
      icon: <MdStorage />,
      href: '/admin/document-processing/storage',
    },
    {
      id: 'manageWorkflows',
      label: 'Workflows',
      icon: <MdOutlineWorkspaces />,
    },
    {
      id: 'exceptions',
      label: 'Exceptions',
      icon: <MdErrorOutline />,
      badge: '12',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <MdOutlineAnalytics />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <MdSettings />,
    }
  ];

  // Document processing tiles
  const documentTiles = [
        {
      title: "Store Documents",
      description: "Store a document or set of documents",
      icon: <MdStorage size={24} />,
      path: "/admin/document-processing/storage",
      bgColor: "bg-teal-900/30",
      iconColor: "text-teal-400"
    },
    {
      title: "Process Single Document",
      description: "Upload and process an individual document",
      icon: <MdDocumentScanner size={24} />,
      path: "/admin/document-processing/process",
      bgColor: "bg-blue-900/30",
      iconColor: "text-blue-400"
    },
    {
      title: "Use Predefined Workflow",
      description: "Process a document with an existing workflow",
      icon: <FaRegFileAlt size={22} />,
      path: "/admin/document-processing/workflow",
      bgColor: "bg-purple-900/30",
      iconColor: "text-purple-400"
    },
    {
      title: "Manage Exceptions",
      description: "Review and handle processing exceptions",
      icon: <MdErrorOutline size={24} />,
      path: "/admin/document-processing/exceptions",
      bgColor: "bg-amber-900/30",
      iconColor: "text-amber-400"
    },
    {
      title: "IDP Performance",
      description: "View insights and analytics on processing",
      icon: <MdInsights size={24} />,
      path: "/admin/dashboards/performance",
      bgColor: "bg-green-900/30",
      iconColor: "text-green-400"
    }
  ];

  // System tiles
  const systemTiles = [
    {
      title: "Create Workflow",
      description: "Design a new document processing workflow",
      icon: <MdAdd size={24} />,
      path: "/admin/workflows/create",
      bgColor: "bg-indigo-900/30",
      iconColor: "text-indigo-400"
    },
    {
      title: "Manage Workflows",
      description: "Edit and organize existing workflows",
      icon: <MdOutlineWorkspaces size={24} />,
      path: "/admin/config/workflows",
      bgColor: "bg-teal-900/30",
      iconColor: "text-teal-400"
    },
  ];

  // API and Integration tiles
  const integrationTiles = [
    {
      title: "Onboard API Client",
      description: "Set up a new integration partner",
      icon: <MdApi size={24} />,
      path: "/admin/api/onboard",
      bgColor: "bg-rose-900/30",
      iconColor: "text-rose-400"
    },
    {
      title: "API Configuration",
      description: "Manage API settings and access",
      icon: <FaNetworkWired size={22} />,
      path: "/admin/config/services",
      bgColor: "bg-sky-900/30",
      iconColor: "text-sky-400"
    },
  ];

  // Admin tiles
  const adminTiles = [
    {
      title: "Training Flywheel",
      description: "Configure and monitor model training",
      icon: <FaRobot size={22} />,
      path: "/admin/config/model-training",
      bgColor: "bg-orange-900/30",
      iconColor: "text-orange-400"
    },
    {
      title: "User Management",
      description: "Manage users, roles and permissions",
      icon: <MdPeople size={24} />,
      path: "/admin/config/user-management",
      bgColor: "bg-cyan-900/30",
      iconColor: "text-cyan-400"
    }
  ];

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(currentDate);

  return (
    <div className="min-h-screen bg-navy-900 text-white p-5">
      
      {/* Quick actions */}
      <div className="mt-5">
        <h2 className="text-lg font-medium mb-4 text-gray-300">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <QuickActionButton 
              key={action.id}
              icon={action.icon}
              label={action.label}
              badge={action.badge}
              href={action.href}
              isActive={!action.href && activeComponent === action.id}
              onClick={() => !action.href && handleQuickAction(action.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Active component section */}
      {activeComponent && (
        <div className="mt-5 bg-navy-800 rounded-xl border border-navy-700 p-5">
          {activeComponent === 'processSingle' && <ProcessDocument />}
          {activeComponent === 'manageWorkflows' && <WorkflowManagement />}
          {/* Add other component conditions here */}
        </div>
      )}
      
      {/* Tiles Section */}
      {!activeComponent && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardCard title="Document Processing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documentTiles.map((tile, index) => (
                <Link 
                  key={index}
                  href={tile.path}
                  className="flex items-center p-3 rounded-lg border border-navy-700 bg-navy-900/50 hover:bg-navy-700 transition-colors"
                >
                  <div className={`${tile.bgColor} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                    <div className={`${tile.iconColor}`}>{tile.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{tile.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tile.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardCard>
          
          <DashboardCard title="System Management">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {systemTiles.map((tile, index) => (
                <Link 
                  key={index}
                  href={tile.path}
                  className="flex items-center p-3 rounded-lg border border-navy-700 bg-navy-900/50 hover:bg-navy-700 transition-colors"
                >
                  <div className={`${tile.bgColor} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                    <div className={`${tile.iconColor}`}>{tile.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{tile.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tile.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            
            <h3 className="text-sm font-medium text-gray-300 mt-4 mb-3">API & Integration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrationTiles.map((tile, index) => (
                <Link 
                  key={index}
                  href={tile.path}
                  className="flex items-center p-3 rounded-lg border border-navy-700 bg-navy-900/50 hover:bg-navy-700 transition-colors"
                >
                  <div className={`${tile.bgColor} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                    <div className={`${tile.iconColor}`}>{tile.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{tile.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tile.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            
            <h3 className="text-sm font-medium text-gray-300 mt-4 mb-3">Administration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adminTiles.map((tile, index) => (
                <Link 
                  key={index}
                  href={tile.path}
                  className="flex items-center p-3 rounded-lg border border-navy-700 bg-navy-900/50 hover:bg-navy-700 transition-colors"
                >
                  <div className={`${tile.bgColor} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                    <div className={`${tile.iconColor}`}>{tile.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{tile.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tile.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
};

export default IDPDashboard; 