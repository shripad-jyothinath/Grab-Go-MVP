import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import { AlertTriangle, Download, X, CheckCircle, Info, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

// Lazy Load Dashboards for Better Initial Load Performance
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const RestaurantDashboard = lazy(() => import('./components/RestaurantDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const MaintenanceBanner = () => (
    <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-md">
        <AlertTriangle className="w-4 h-4" />
        <span>Maintenance in progress. Sorry for the inconvenience.</span>
    </div>
);

// Toast Notification Container
const ToastContainer = () => {
    const { toasts, removeToast } = useApp();
    return (
        <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div 
                    key={t.id} 
                    className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-fade-in-left transition-all ${
                        t.type === 'success' ? 'bg-white border-green-200 text-green-800' :
                        t.type === 'error' ? 'bg-white border-red-200 text-red-800' :
                        'bg-white border-slate-200 text-slate-800'
                    }`}
                >
                    {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                    {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
                    
                    <p className="text-sm font-medium flex-1">{t.message}</p>
                    
                    <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
);

// PWA Install Prompt Component
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
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

// Error Boundary for React 18 (since it doesn't have a hook for this yet)
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6">We encountered an unexpected error.</p>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Reload App
            </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Suspense wrapper for lazy components
  const DashboardView = () => {
      if (user.role === 'admin') return <AdminDashboard />;
      if (user.role === 'restaurant_owner') return <RestaurantDashboard />;
      return <StudentDashboard />;
  }

  return (
      <div className="relative">
          {isTestMode && <MaintenanceBanner />}
          <Suspense fallback={<LoadingScreen />}>
              <DashboardView />
          </Suspense>
          <InstallPrompt />
      </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
        <ToastContainer />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;