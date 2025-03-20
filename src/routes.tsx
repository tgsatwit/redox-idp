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
  // --- Main pages ---
  {
    name: 'Main Pages',
    path: '/main',
    icon: Icon(MdDashboard),
    collapse: true,
    items: [
      {
        name: 'Account',
        path: '/main/account',
        collapse: true,
        items: [
          {
            name: 'Billing',
            layout: '/admin',
            path: '/main/account/billing',
            exact: false,
          },
          {
            name: 'Application',
            layout: '/admin',
            path: '/main/account/application',
            exact: false,
          },
          {
            name: 'Invoice',
            layout: '/admin',
            path: '/main/account/invoice',
            exact: false,
          },
          {
            name: 'Settings',
            layout: '/admin',
            path: '/main/account/settings',
            exact: false,
          },
          {
            name: 'All Courses',
            layout: '/admin',
            path: '/main/account/all-courses',
            exact: false,
          },
          {
            name: 'Course Page',
            layout: '/admin',
            path: '/main/account/course-page',
            exact: false,
          },
        ],
      },
      {
        name: 'Ecommerce',
        path: '/ecommerce',
        collapse: true,
        items: [
          {
            name: 'New Product',
            layout: '/admin',
            path: '/main/ecommerce/new-product',
            exact: false,
          },
          {
            name: 'Product Settings',
            layout: '/admin',
            path: '/main/ecommerce/settings',
            exact: false,
          },
          {
            name: 'Product Page',
            layout: '/admin',
            path: '/main/ecommerce/page-example',
            exact: false,
          },
          {
            name: 'Order List',
            layout: '/admin',
            path: '/main/ecommerce/order-list',
            exact: false,
          },
          {
            name: 'Order Details',
            layout: '/admin',
            path: '/main/ecommerce/order-details',
            exact: false,
          },
          {
            name: 'Referrals',
            layout: '/admin',
            path: '/main/ecommerce/referrals',
            exact: false,
          },
        ],
      },
      {
        name: 'Users',
        path: '/main/users',
        collapse: true,
        items: [
          {
            name: 'New User',
            layout: '/admin',
            path: '/main/users/new-user',
            exact: false,
          },
          {
            name: 'Users Overview',
            layout: '/admin',
            path: '/main/users/users-overview',
            exact: false,
          },
          {
            name: 'Users Reports',
            layout: '/admin',
            path: '/main/users/users-reports',
            exact: false,
          },
        ],
      },
      {
        name: 'Applications',
        path: '/main/applications',
        collapse: true,
        items: [
          {
            name: 'Kanban',
            layout: '/admin',
            path: '/main/applications/kanban',
            exact: false,
          },
          {
            name: 'Data Tables',
            layout: '/admin',
            path: '/main/applications/data-tables',
            exact: false,
          },
          {
            name: 'Calendar',
            layout: '/admin',
            path: '/main/applications/calendar',
            exact: false,
          },
        ],
      },
      {
        name: 'Profile',
        path: '/main/profile',
        collapse: true,
        items: [
          {
            name: 'Profile Overview',
            layout: '/admin',
            path: '/main/profile/overview',
            exact: false,
          },
          {
            name: 'Profile Settings',
            layout: '/admin',
            path: '/main/profile/settings',
            exact: false,
          },
          {
            name: 'News Feed',
            layout: '/admin',
            path: '/main/profile/newsfeed',
            exact: false,
          },
        ],
      },
      {
        name: 'Others',
        path: '/main/others',
        collapse: true,
        items: [
          {
            name: 'Notifications',
            layout: '/admin',
            path: '/main/others/notifications',
            exact: false,
          },
          {
            name: 'Pricing',
            layout: '/auth',
            path: '/main/others/pricing',
            exact: false,
          },
          {
            name: '404',
            layout: '/admin',
            path: '/main/others/404',
            exact: false,
          },
          {
            name: 'Buttons',
            layout: '/admin',
            path: '/main/others/buttons',
            exact: false,
          },
          {
            name: 'Messages',
            layout: '/admin',
            path: '/main/others/messages',
            exact: false,
          },
        ],
      },
    ],
  },
];
export default routes;
