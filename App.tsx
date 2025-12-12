import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import RestaurantDashboard from './components/RestaurantDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AlertTriangle, Download } from 'lucide-react';

const MaintenanceBanner = () => (
    <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
        <AlertTriangle className="w-4 h-4" />
        <span>Maintenance in progress. Sorry for the inconvenience.</span>
    </div>
);

// PWA Install Prompt Component
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-sm">Install App</p>
          <p className="text-xs text-slate-300">Add to home screen for better experience</p>
        </div>
      </div>
      <div className="flex gap-2">
         <button onClick={() => setShowPrompt(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400">Later</button>
         <button onClick={handleInstallClick} className="px-4 py-1.5 bg-indigo-600 rounded-lg text-xs font-bold">Install</button>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { user, isTestMode } = useApp();

  if (!user) {
    return (
        <>
            {isTestMode && <MaintenanceBanner />}
            <Login />
            <InstallPrompt />
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
          <InstallPrompt />
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