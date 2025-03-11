import {
  MdDashboard,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdSettings,
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
        name: 'Process Document',
        layout: '/admin',
        path: '/dashboards/process-document',
      },
      {
        name: 'Car Interface',
        layout: '/admin',
        path: '/dashboards/car-interface',
      },
      {
        name: 'Smart Home',
        layout: '/admin',
        path: '/dashboards/smart-home',
      },
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
        name: 'Documents',
        layout: '/admin',
        path: '/config/documents',
      },
      {
        name: 'Workflows',
        layout: '/admin',
        path: '/config/workflows',
      },
      {
        name: 'Models',
        layout: '/admin',
        path: '/config/models',
      },
      {
        name: 'Prompts',
        layout: '/admin',
        path: '/config/prompts',
      },
      {
        name: 'Retention',
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
  // --- Authentication ---
  {
    name: 'Authentication',
    path: '/auth',
    icon: Icon(MdLock),
    collapse: true,
    items: [
      // --- Sign In ---
      {
        name: 'Sign In',
        path: '/sign-in',
        collapse: true,
        items: [
          {
            name: 'Default',
            layout: '/auth',
            path: '/sign-in/default',
          },
          {
            name: 'Centered',
            layout: '/auth',
            path: '/sign-in/centered',
          },
        ],
      },
      // --- Sign Up ---
      {
        name: 'Sign Up',
        path: '/sign-up',
        collapse: true,
        items: [
          {
            name: 'Default',
            layout: '/auth',
            path: '/sign-up/default',
          },
          {
            name: 'Centered',
            layout: '/auth',
            path: '/sign-up/centered',
          },
        ],
      },
      // --- Verification ---
      {
        name: 'Verification',
        path: '/verification',
        collapse: true,
        items: [
          {
            name: 'Default',
            layout: '/auth',
            path: '/verification/default',
          },
          {
            name: 'Centered',
            layout: '/auth',
            path: '/verification/centered',
          },
        ],
      },
      // --- Lock ---
      {
        name: 'Lock',
        path: '/lock',
        collapse: true,
        items: [
          {
            name: 'Default',
            layout: '/auth',
            path: '/lock/default',
          },
          {
            name: 'Centered',
            layout: '/auth',
            path: '/lock/centered',
          },
        ],
      },
      // --- Forgot Password ---
      {
        name: 'Forgot Password',
        path: '/forgot-password',
        collapse: true,
        items: [
          {
            name: 'Default',
            layout: '/auth',
            path: '/forgot-password/default',
          },
          {
            name: 'Centered',
            layout: '/auth',
            path: '/forgot-password/centered',
          },
        ],
      },
    ],
  },
];
export default routes;
