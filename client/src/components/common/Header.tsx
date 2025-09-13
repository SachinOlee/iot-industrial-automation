// client/src/components/common/Header.tsx
import React, { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';
import NepaliDate from 'nepali-date-converter';
import {
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [nepaliDateTime, setNepaliDateTime] = useState<string>('');

  useEffect(() => {
    const updateNepaliDateTime = () => {
      try {
        const now = new Date();
        const nepaliDate = new NepaliDate(now);

        // Format Nepali date and time
        const nepaliDateStr = nepaliDate.format('YYYY-MM-DD');
        const timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setNepaliDateTime(`${nepaliDateStr} ${timeStr}`);
      } catch (error) {
        console.error('Error converting to Nepali date:', error);
        // Fallback to regular date/time
        const now = new Date();
        setNepaliDateTime(now.toLocaleString());
      }
    };

    // Update immediately
    updateNepaliDateTime();

    // Update every second for live time
    const interval = setInterval(updateNepaliDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg border-b border-blue-500/20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left side - Sidebar Toggle Buttons */}
          <div className="flex items-center">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 md:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hidden md:block"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Center - Title and Date/Time */}
          <div className="flex-1 flex justify-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  IoT Industrial Automation
                </h1>
                {nepaliDateTime && (
                  <div className="text-sm text-blue-100 font-medium drop-shadow-md">
                    🗓️ {nepaliDateTime}
                  </div>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
              <BellIcon className="h-6 w-6" />
            </button>

            {/* User menu */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm">
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  {user?.firstName} {user?.lastName}
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-3">
                    <p className="text-sm">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } flex items-center px-4 py-2 text-sm`}
                        >
                          <UserCircleIcon className="h-4 w-4 mr-3" />
                          Profile Settings
                        </Link>
                      )}
                    </Menu.Item>
                    {user?.role === 'admin' && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/admin"
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } flex items-center px-4 py-2 text-sm`}
                          >
                            Admin Panel
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } flex items-center w-full px-4 py-2 text-sm text-left`}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;