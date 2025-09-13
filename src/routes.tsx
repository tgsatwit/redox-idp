import {
  MdDashboard,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdSettings,
  MdOutlineDescription,
} from 'react-icons/md';
import React from 'react';

// Admin Imports

// Helper function to create icon with className using type assertion to fix type error
const Icon = (IconComponent: React.ComponentType<any>) => (
  <IconComponent className="text-inherit h-5 w-5" />
);

const routes = [
  // --- Dashboards ---
  {
    name: 'Dashboards',
    path: '/dashboards',
    icon: Icon(MdHome),
    collapse: true,
    items: [
      {
        name: 'Main Dashboard',
        layout: '/admin',
        path: '/dashboards/default',
      },
      {
        name: 'IDP Performance',
        layout: '/admin',
        path: '/dashboards/performance',
      },
      {
        name: 'User Dashboard',
        layout: '/admin',
        path: '/dashboards/user-dashboard',
      },  
      {
        name: 'Team Dashboard',
        layout: '/admin',
        path: '/dashboards/team-dashboard',
      },
    ],
  },
  // --- Document Processing ---
  {
    name: 'Document Processing',
    path: '/document-processing',
    icon: Icon(MdOutlineDescription),
    collapse: true,
    items: [
      {
        name: 'Store Documents',
        layout: '/admin',
        path: '/document-processing/storage',
      },
      {
        name: 'Process Document',
        layout: '/admin',
        path: '/document-processing/process',
      },
      {
        name: 'Credit Card',
        layout: '/admin',
        path: '/document-processing/cc',
      },
      {
        name: 'Document Workflow',
        layout: '/admin',
        path: '/document-processing/workflow',
      },
      {
        name: 'Exception Management',
        layout: '/admin',
        path: '/document-processing/exceptions',
      },
      {
        name: 'Document Queue',
        layout: '/admin',
        path: '/document-processing/queue',
      },
      {
        name: 'Processed Documents',
        layout: '/admin',
        path: '/document-processing/processed',
      },
      {
        name: 'Rejected Documents',
        layout: '/admin',
        path: '/document-processing/rejected',
      }
    ],
  },
  // --- Configuration ---
  {
    name: 'Configuration',
    path: '/config',
    icon: Icon(MdSettings),
    collapse: true,
    items: [
      {
        name: 'Document Types',
        layout: '/admin',
        path: '/config/documents',
      },
      {
        name: 'Services',
        layout: '/admin',
        path: '/config/services',
      },
      {
        name: 'Workflows',
        layout: '/admin',
        path: '/config/workflows',
      },
      {
        name: 'Model Management',
        layout: '/admin',
        path: '/config/training',
      },
      {
        name: 'Prompt Management',
        layout: '/admin',
        path: '/config/prompts',
      },
      {
        name: 'Retention Policies',
        layout: '/admin',
        path: '/config/retention',
      },

    ],
  },
];
export default routes;
