'use client';

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TrainerLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export default function TrainerLayout({ children, currentPage = 'dashboard' }: TrainerLayoutProps) {
  const { user, signOut } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 002 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2V5z" />
        </svg>
      ),
      id: 'dashboard'
    },
    {
      name: 'Trainees',
      href: '/trainees',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3 3 0 003-3V12a3 3 0 00-3-3h-4.5z" />
        </svg>
      ),
      id: 'trainees'
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      id: 'sessions'
    },
    {
      name: 'Schedule',
      href: '/schedule',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 12V7m6 0v14m-6-4h6" />
        </svg>
      ),
      id: 'schedule'
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      id: 'payments'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      id: 'profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen fixed">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">
              Trainer Hub
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, {user.profile.firstName}!
            </p>
          </div>

          <nav className="mt-6">
            <div className="px-6 space-y-1">
              {navigationItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="absolute bottom-6 left-6">
            <button
              onClick={signOut}
              className="text-gray-700 hover:text-gray-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
            >
              <svg className="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {children}
        </div>
      </div>
    </div>
  );
}