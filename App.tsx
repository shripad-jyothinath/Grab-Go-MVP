import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import RestaurantDashboard from './components/RestaurantDashboard';
import StudentDashboard from './components/StudentDashboard';

const MainContent: React.FC = () => {
  const { user } = useApp();

  if (!user) {
    return <Login />;
  }

  if (user.role === 'restaurant') {
    return <RestaurantDashboard />;
  }

  return <StudentDashboard />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;