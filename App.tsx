import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ParticipantsView } from './components/ParticipantsView';
import { EventsView } from './components/EventsView';
import { RegistrationsView } from './components/RegistrationsView';
import { ReportsView } from './components/ReportsView';
import { CertificatesView } from './components/CertificatesView';
import { usePIMSData } from './hooks/usePIMSData';
import type { User, View } from './types';
import { ToastProvider, useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
import { LoginView } from './components/LoginView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';

const PimsApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pimsData = usePIMSData();
  const addToast = useToast();
  
  if (pimsData.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading PIMS Data...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogin = (email: string, pass: string) => {
    const user = pimsData.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass
    );
    if (user) {
      setCurrentUser(user);
      addToast(`Login successful! Welcome, ${user.role}.`, 'success');
    } else {
      addToast('Invalid email or password.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard'); // Reset view on logout
    addToast('You have been logged out.', 'info');
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const currentUserRole = currentUser.role;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...pimsData} />;
      case 'participants':
        return <ParticipantsView {...pimsData} currentUserRole={currentUserRole} />;
      case 'events':
        return <EventsView {...pimsData} currentUserRole={currentUserRole} />;
      case 'registrations':
        return <RegistrationsView {...pimsData} currentUserRole={currentUserRole} />;
      case 'reports':
        return <ReportsView participants={pimsData.participants} events={pimsData.events} participations={pimsData.participations} />;
      case 'certificates':
        return <CertificatesView {...pimsData} />;
      case 'settings':
        if (currentUserRole !== 'Super Admin') return <Dashboard {...pimsData} />;
        return <SettingsView users={pimsData.users} addUser={pimsData.addUser} updateUser={pimsData.updateUser} deleteUser={pimsData.deleteUser} currentUser={currentUser} seedDatabase={pimsData.seedDatabase} />;
      case 'profile':
        return <ProfileView currentUser={currentUser} updateUser={pimsData.updateUser} setCurrentUser={setCurrentUser} />;
      default:
        return <Dashboard {...pimsData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isSidebarOpen={isSidebarOpen} 
        currentUserRole={currentUserRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentUser={currentUser}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          onNavigateToProfile={() => setCurrentView('profile')}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <PimsApp />
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;