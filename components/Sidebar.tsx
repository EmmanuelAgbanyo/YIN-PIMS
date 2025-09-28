
import React from 'react';
import type { AppView, UserRole } from '../types';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUserRole: UserRole;
}

interface NavItem {
    view: AppView;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen, currentUserRole }) => {

    const navItems: NavItem[] = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['Super Admin', 'Admin', 'Organizer', 'Viewer'] },
        { view: 'participants', label: 'Participants', icon: <UsersIcon />, roles: ['Super Admin', 'Admin', 'Organizer', 'Viewer'] },
        { view: 'events', label: 'Events', icon: <CalendarIcon />, roles: ['Super Admin', 'Admin', 'Organizer', 'Viewer'] },
        { view: 'registrations', label: 'Registrations', icon: <ClipboardListIcon />, roles: ['Super Admin', 'Admin', 'Organizer'] },
        { view: 'reports', label: 'Reports', icon: <ChartBarIcon />, roles: ['Super Admin', 'Admin', 'Organizer'] },
        { view: 'certificates', label: 'Certificates', icon: <AcademicCapIcon />, roles: ['Super Admin', 'Admin', 'Organizer'] },
        { view: 'verification', label: 'Verify Member', icon: <QRIcon />, roles: ['Super Admin', 'Admin', 'Organizer'] },
        { view: 'settings', label: 'System Settings', icon: <CogIcon />, roles: ['Super Admin'] },
    ];

    const handleNavigation = (view: AppView) => {
        setCurrentView(view);
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };
    
    const visibleNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`absolute lg:relative inset-y-0 left-0 bg-white dark:bg-gray-800 w-64 transform transition-transform duration-300 ease-in-out z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r dark:border-gray-700 flex flex-col`}
      >
        <div className="flex items-center justify-center h-16 border-b dark:border-gray-700 px-4">
          <h1 className="text-2xl font-bold text-primary">YIN PIMS</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {visibleNavItems.map(({ view, label, icon }) => (
                <button
                    key={view}
                    onClick={() => handleNavigation(view)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        currentView === view
                        ? 'bg-primary text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    {icon}
                    <span className="ml-3">{label}</span>
                </button>
            ))}
        </nav>
      </aside>
    </>
  );
};

// Icons
const iconClass = "h-5 w-5";
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0110 13v-2.267a5.002 5.002 0 015.69-4.949A5.002 5.002 0 0120 10v4a1 1 0 01-1 1h-4.07zM4.11 15.36A5 5 0 0110 13v-2.267a5.002 5.002 0 015.69-4.949A5.002 5.002 0 0120 10" /><path d="M4.11 15.36A5 5 0 010 10v-4a5.002 5.002 0 015.69-4.949A5.002 5.002 0 0110 5.733V8a5 5 0 01-5.89 4.36z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a1 1 0 001 1h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l3.293 3.293a1 1 0 001.414-1.414L13.414 12H16a1 1 0 001-1V5a1 1 0 00-1-1H3zm12 2v2h-2V5h2zM5 5h2v5H5V5zm4 0h2v3h-2V5z" clipRule="evenodd" /></svg>;
const AcademicCapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.042.822l-1.044 2.61a1 1 0 00.956 1.445l3.421-.855a.997.997 0 01.52.068l1.75 1.05a1 1 0 001.12.068l1.75-1.05a.997.997 0 01.52-.068l3.421.855a1 1 0 00.956-1.445l-1.044-2.61a.999.999 0 01.042-.822L17.394 6.92a1 1 0 000-1.84l-7-3zM10 8a1 1 0 100-2 1 1 0 000 2z" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path d="M10 15c-1.1 0-2 .9-2 2v1h4v-1c0-1.1-.9-2-2-2z" /></svg>;
const QRIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V4h2v2H5zM3 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm2 2v-2h2v2H5zM10 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zm2 2V4h2v2h-2zM8 9a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1H8zm6 6H9v-4h5v4zm-8-2a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm14-2a1 1 0 100-2h-2a1 1 0 100 2h2z" clipRule="evenodd" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;