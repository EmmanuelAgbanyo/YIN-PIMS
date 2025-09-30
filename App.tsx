import React, { useState } from 'react';
import { usePIMSData } from './hooks/usePIMSData';
import { AppSettingsProvider } from './hooks/useAppSettings';
import type { User, AppView } from './types';

import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ParticipantsView } from './components/ParticipantsView';
import { EventsView } from './components/EventsView';
import { ClubsView } from './components/ClubsView';
import { VolunteersView } from './components/VolunteersView';
import { RegistrationsView } from './components/RegistrationsView';
import { ReportsView } from './components/ReportsView';
import { CertificatesView } from './components/CertificatesView';
import { MembershipCardVerificationView } from './components/MembershipCardVerificationView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';

import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';

const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <PimsApp />
    </AppSettingsProvider>
  );
};

const PimsApp: React.FC = () => {
  const pimsData = usePIMSData();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (email: string, pass: string) => {
    const user = pimsData.users.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
    } else {
      // In a real app, you'd show an error toast.
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...pimsData} />;
      case 'participants':
        return <ParticipantsView {...pimsData} currentUserRole={currentUser!.role} />;
      case 'events':
        return <EventsView {...pimsData} currentUserRole={currentUser!.role} />;
      case 'clubs':
        return <ClubsView {...pimsData} currentUser={currentUser!} />;
      case 'volunteers':
        return <VolunteersView {...pimsData} currentUser={currentUser!} />;
      case 'registrations':
        return <RegistrationsView {...pimsData} currentUserRole={currentUser!.role} />;
      case 'reports':
        return <ReportsView {...pimsData} />;
      case 'certificates':
        return <CertificatesView {...pimsData} />;
       case 'verification':
        return <MembershipCardVerificationView participants={pimsData.participants} />;
      case 'settings':
        return <SettingsView 
                  users={pimsData.users} 
                  clubs={pimsData.clubs}
                  currentUser={currentUser!}
                  addUser={pimsData.addUser}
                  updateUser={pimsData.updateUser}
                  deleteUser={pimsData.deleteUser}
                />;
      case 'profile':
        return <ProfileView currentUser={currentUser!} updateUser={pimsData.updateUser} setCurrentUser={setCurrentUser} />;
      default:
        return <Dashboard {...pimsData} />;
    }
  };
  
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          currentUserRole={currentUser.role}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            currentUser={currentUser}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={handleLogout}
            onNavigateToProfile={() => setCurrentView('profile')}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {renderView()}
          </main>
        </div>
      </div>
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
