// client/src/components/common/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CogIcon,
  UsersIcon,
  CircuitBoardIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Sensor Data',
      href: '/sensors',
      icon: CircuitBoardIcon,
      current: location.pathname.startsWith('/sensors'),
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      current: location.pathname === '/analytics',
    },
    {
      name: 'Maintenance Alerts',
      href: '/alerts',
      icon: ExclamationTriangleIcon,
      current: location.pathname === '/alerts',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      current: location.pathname === '/settings',
    },
  ];

  const adminNavigation = [
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: UsersIcon,
      current: location.pathname.startsWith('/admin'),
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-lg font-medium text-gray-900">Navigation</h2>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  item.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={classNames(
                    item.current
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
            
            {user?.role === 'admin' && (
              <div className="mt-8">
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                <div className="mt-2 space-y-1">
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          item.current
                            ? 'text-blue-500'
                            : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-6 w-6'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;