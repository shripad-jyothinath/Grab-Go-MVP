import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ChefHat, GraduationCap, ArrowRight, AlertCircle, Lock, User, LogIn, UserPlus, Store } from 'lucide-react';

const Login: React.FC = () => {
  const { login, signup } = useApp();
  
  // Tabs: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [cuisine, setCuisine] = useState(''); // Only for restaurant signup
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = await login(username, password);
        if (!result.success) {
          setError(result.message || 'Login failed');
        }
      } else {
        // Validation
        if (password.length < 4) {
          setError('Password must be at least 4 characters');
          setIsLoading(false);
          return;
        }
        
        const extraData = role === 'restaurant' ? { cuisine } : undefined;
        const result = await signup(username, password, role, extraData);
        if (!result.success) {
          setError(result.message || 'Sign up failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError('');
    setUsername('');
    setPassword('');
    // Reset defaults
    if (newMode === 'signup') {
      setRole('student');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-indigo-600"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CampusCrave</h1>
          <p className="text-slate-500">
            {mode === 'signin' ? 'Welcome back!' : 'Join the campus food revolution'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => toggleMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'signin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Role Selection (Only for Sign Up) */}
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'student'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
                <span className="font-medium text-sm">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('restaurant')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'restaurant'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <ChefHat className="w-6 h-6" />
                <span className="font-medium text-sm">Restaurant</span>
              </button>
            </div>
          )}

          {/* Inputs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {role === 'restaurant' && mode === 'signup' ? 'Restaurant Name' : 'Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder={role === 'restaurant' ? "e.g. Campus Grill" : "e.g. AlexSmith"}
              />
            </div>
          </div>

          {/* Cuisine Input (Only for Restaurant Signup) */}
          {mode === 'signup' && role === 'restaurant' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cuisine Type</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Burgers, Vegan, Asian..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] ${
                mode === 'signup' && role === 'restaurant' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'
            } disabled:opacity-70`}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        {mode === 'signin' && (
            <p className="text-center text-xs text-slate-400 mt-6">
                For Admin access, use ID: <b>Admin</b>
            </p>
        )}
      </div>
    </div>
  );
};

export default Login;