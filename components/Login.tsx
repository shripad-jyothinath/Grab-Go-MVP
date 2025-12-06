import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ChefHat, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    
    const success = login(name, selectedRole);
    if (!success && selectedRole === 'restaurant') {
      setError('Restaurant not found. Please verify the name matches a registered restaurant.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CampusCrave</h1>
          <p className="text-slate-500">Pre-order food or manage your kitchen</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setSelectedRole('student'); setError(''); }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                selectedRole === 'student'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              <GraduationCap className="w-8 h-8" />
              <span className="font-medium">Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('restaurant'); setError(''); }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                selectedRole === 'restaurant'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              <ChefHat className="w-8 h-8" />
              <span className="font-medium">Restaurant</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {selectedRole === 'student' ? 'Your Name' : 'Restaurant Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder={selectedRole === 'student' ? "e.g. Alex Smith" : "e.g. Campus Grill"}
            />
            {selectedRole === 'restaurant' && (
              <p className="text-xs text-slate-400 mt-1">
                Try: "Campus Grill", "Green Leaf", or "Bean There"
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;