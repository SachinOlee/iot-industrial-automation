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
  CpuChipIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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
      icon: CpuChipIcon,
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={classNames(
        "flex-col fixed inset-y-0 pt-20 transition-all duration-300 ease-in-out z-50",
        "bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 overflow-y-auto shadow-xl",
        // Mobile styles
        "w-64",
        // Mobile visibility
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop styles
        "hidden md:flex",
        isOpen ? "md:translate-x-0 md:w-64" : "md:-translate-x-full md:w-0"
      )}>
      <div className="flex flex-col flex-grow pt-5 pb-4">
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Navigation</h2>
          {/* Hide Sidebar Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-all duration-200 group shadow-sm"
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  item.current
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700',
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm'
                )}
              >
                <item.icon
                  className={classNames(
                    item.current
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-blue-500',
                    'mr-4 flex-shrink-0 h-5 w-5 transition-colors duration-200'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
            
            {user?.role === 'admin' && (
              <div className="mt-8">
                <div className="px-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-2 rounded-lg">
                    Administration
                  </h3>
                </div>
                <div className="mt-3 space-y-2">
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700',
                        'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200 hover:shadow-sm'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          item.current
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-purple-500',
                          'mr-4 flex-shrink-0 h-5 w-5 transition-colors duration-200'
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
    </>
  );
};

export default Sidebar;