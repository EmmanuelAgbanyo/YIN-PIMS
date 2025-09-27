import React from 'react';
import type { View, UserRole } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
  currentUserRole: UserRole;
}

const NavItem: React.FC<{
  viewName: View;
  label: string;
  icon: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
}> = ({ viewName, label, icon, currentView, setCurrentView, isSidebarOpen }) => {
  const isActive = currentView === viewName;
  return (
    <li>
      <button
        onClick={() => setCurrentView(viewName)}
        className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-primary text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        } ${!isSidebarOpen && 'justify-center'}`}
      >
        {icon}
        <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-xs' : 'max-w-0 ml-0'}`}>
          {label}
        </span>
      </button>
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isSidebarOpen, currentUserRole }) => {
  return (
    <div className={`flex-shrink-0 h-full flex flex-col bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className={`ml-2 text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-xs' : 'max-w-0'}`}>
          YIN PIMS
        </span>
      </div>
      <nav className={`flex-1 py-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
        <ul>
          <NavItem viewName="dashboard" label="Dashboard" icon={<DashboardIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          <NavItem viewName="participants" label="Participants" icon={<ParticipantsIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          <NavItem viewName="events" label="Events" icon={<EventsIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          <NavItem viewName="registrations" label="Registrations" icon={<RegistrationsIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          <NavItem viewName="reports" label="Reports" icon={<ReportsIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          <NavItem viewName="certificates" label="Certificates" icon={<CertificateIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          {currentUserRole === 'Super Admin' && (
            <NavItem viewName="settings" label="User Management" icon={<SettingsIcon />} currentView={currentView} setCurrentView={setCurrentView} isSidebarOpen={isSidebarOpen} />
          )}
        </ul>
      </nav>
      <div className="p-4 border-t dark:border-gray-700">
        <div className={`text-xs text-center text-gray-500 overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-xs' : 'max-w-0'}`}>
          <p className="whitespace-nowrap">© 2025 Young Investors Network</p>
          <p className="whitespace-nowrap">Dev: Emmanuel Agbanyo</p>
        </div>
      </div>
    </div>
  );
};

// --- SVG Icons ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ParticipantsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>;
const EventsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const RegistrationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 5a2 2 0 00-2-2h-3a2 2 0 00-2 2v14a2 2 0 002 2h3a2 2 0 002-2V5z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CertificateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
