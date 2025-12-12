import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import RestaurantDashboard from './components/RestaurantDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AlertTriangle } from 'lucide-react';

const MaintenanceBanner = () => (
    <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
        <AlertTriangle className="w-4 h-4" />
        <span>Maintenance in progress. Sorry for the inconvenience.</span>
    </div>
);

const MainContent: React.FC = () => {
  const { user, isTestMode } = useApp();

  if (!user) {
    return (
        <>
            {isTestMode && <MaintenanceBanner />}
            <Login />
        </>
    );
  }

  // Admin Dashboard handles its own test mode indicators
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Wrapper for non-admins to show banner
  return (
      <div className="relative">
          {isTestMode && <MaintenanceBanner />}
          {user.role === 'restaurant_owner' ? <RestaurantDashboard /> : <StudentDashboard />}
      </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
