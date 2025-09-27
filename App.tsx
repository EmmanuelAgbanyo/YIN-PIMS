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

const PimsApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pimsData = usePIMSData();
  const addToast = useToast();
  
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
        return <SettingsView users={pimsData.users} addUser={pimsData.addUser} updateUser={pimsData.updateUser} deleteUser={pimsData.deleteUser} currentUser={currentUser} />;
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
