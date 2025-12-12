import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ChefHat, GraduationCap, ArrowRight, AlertCircle, Lock, User, LogIn, UserPlus, Store, MessageCircle, Phone, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, signup, checkPhoneAvailable, sendVerificationOTP } = useApp();
  
  // Tabs: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // Signup Step: 'details' | 'otp'
  const [signupStep, setSignupStep] = useState<'details' | 'otp'>('details');
  
  // Form State
  const [username, setUsername] = useState(''); // Serves as identifier in login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [cuisine, setCuisine] = useState(''); // Only for restaurant signup
  
  // OTP State
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // For pending approval
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'signin') {
        setIsLoading(true);
        try {
            const result = await login(username, password);
            if (!result.success) {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    } else {
        // --- SIGN UP FLOW ---
        if (signupStep === 'details') {
            // Validate Details First
            if (!username) {
                setError('Username is required');
                return;
            }
            if (password.length < 4) {
                setError('Password must be at least 4 characters');
                return;
            }
            if (!/^\d{10}$/.test(phoneNumber)) {
                setError('Please enter a valid 10-digit phone number');
                return;
            }
            
            setIsLoading(true);

            // Check if phone number is unique
            if (!checkPhoneAvailable(phoneNumber)) {
                setError('This phone number is already registered.');
                setIsLoading(false);
                return;
            }

            // Generate OTP via Context (Simulation)
            try {
                const otp = await sendVerificationOTP(phoneNumber);
                setGeneratedOTP(otp);
                setSignupStep('otp');
                // Simulate the device receiving it
                alert(`[SMS/WhatsApp Verification Simulation]\n\nSent to: ${phoneNumber}\nYour verification code is: ${otp}`);
            } catch (e) {
                setError("Failed to send verification code. Please try again.");
            } finally {
                setIsLoading(false);
            }

        } else {
            // Verify OTP and Register
            if (enteredOTP !== generatedOTP) {
                setError('Invalid OTP code. Please try again.');
                return;
            }

            setIsLoading(true);
            try {
                const extraData = role === 'restaurant' ? { cuisine } : undefined;
                const result = await signup(username, phoneNumber, password, role, extraData);
                
                if (!result.success) {
                    setError(result.message || 'Sign up failed');
                    // If failed (maybe race condition), go back to details
                    if (result.message?.includes('taken') || result.message?.includes('registered')) {
                        setSignupStep('details');
                    }
                } else if (result.message === 'PENDING_APPROVAL') {
                    setSuccessMsg('approval_needed');
                }
            } catch (err) {
                setError('Registration failed.');
            } finally {
                setIsLoading(false);
            }
        }
    }
  };

  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setSignupStep('details');
    setError('');
    setSuccessMsg('');
    setUsername('');
    setPassword('');
    setPhoneNumber('');
    setEnteredOTP('');
    // Reset defaults
    if (newMode === 'signup') {
      setRole('student');
    }
  };

  if (successMsg === 'approval_needed') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Pending</h2>
                <p className="text-slate-600 mb-6">
                    Thanks for registering <b>{username}</b>! To activate your restaurant on CampusCrave, we need to verify your business.
                </p>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-left mb-6">
                    <h3 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5" /> Next Steps:
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                        1. Take a photo of your restaurant/kitchen.
                    </p>
                    <p className="text-sm text-green-700 mb-2">
                        2. Send it to our Admin WhatsApp along with your Restaurant Name.
                    </p>
                    <p className="text-sm font-mono bg-white p-2 rounded border border-green-200 text-center mt-3 select-all">
                        +1 (555) 012-3456
                    </p>
                </div>

                <button 
                    onClick={() => toggleMode('signin')}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition"
                >
                    Back to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden animate-fade-in">
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
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'signin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode('signup')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'signin' && (
             <div>
                <label className="block text-slate-700 font-bold mb-2">Username or Phone Number</label>
                <div className="flex items-center bg-slate-100 rounded-lg p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <User className="w-5 h-5 text-slate-400 mr-3" />
                  <input 
                    type="text" 
                    placeholder="e.g. johndoe or 5550123456" 
                    className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
             </div>
          )}

          {mode === 'signup' && signupStep === 'details' && (
            <>
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition ${
                    role === 'student' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="font-bold text-sm">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('restaurant')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition ${
                    role === 'restaurant' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <ChefHat className="w-6 h-6" />
                  <span className="font-bold text-sm">Restaurant</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">
                    {role === 'restaurant' ? 'Restaurant Name' : 'Username'}
                </label>
                <div className="flex items-center bg-slate-100 rounded-lg p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  {role === 'restaurant' ? <Store className="w-5 h-5 text-slate-400 mr-3" /> : <User className="w-5 h-5 text-slate-400 mr-3" />}
                  <input 
                    type="text" 
                    placeholder={role === 'restaurant' ? "Campus Grill" : "johndoe"} 
                    className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex items-center bg-slate-100 rounded-lg p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <Smartphone className="w-5 h-5 text-slate-400 mr-3" />
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
                    value={phoneNumber}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setPhoneNumber(val);
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">We will send an OTP via SMS/WhatsApp to verify this number.</p>
              </div>

              {role === 'restaurant' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-2">Cuisine Type</label>
                  <div className="flex items-center bg-slate-100 rounded-lg p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                    <UserPlus className="w-5 h-5 text-slate-400 mr-3" />
                    <input 
                      type="text" 
                      placeholder="e.g. Italian, Burgers, Vegan" 
                      className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'signup' && signupStep === 'otp' && (
             <div className="text-center py-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Verify Your Number</h3>
                <p className="text-slate-500 mb-6 text-sm">
                    We sent a code to <span className="font-bold text-slate-800">{phoneNumber}</span> via SMS/WhatsApp.
                </p>
                
                <input 
                    type="text" 
                    placeholder="Enter 4-digit Code" 
                    className="w-full text-center text-2xl tracking-[0.5em] font-bold p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none mb-4"
                    maxLength={4}
                    value={enteredOTP}
                    onChange={(e) => setEnteredOTP(e.target.value)}
                />

                <button 
                   type="button" 
                   onClick={() => setSignupStep('details')}
                   className="text-indigo-600 text-sm font-bold hover:underline"
                >
                   Wrong number? Go back.
                </button>
             </div>
          )}

          {(mode === 'signin' || signupStep === 'details') && (
            <div>
                <label className="block text-slate-700 font-bold mb-2">Password</label>
                <div className="flex items-center bg-slate-100 rounded-lg p-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition">
                <Lock className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            } ${
              mode === 'signin' 
                ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
          >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-5 h-5" /> Sign In
              </>
            ) : signupStep === 'details' ? (
              <>
                <Smartphone className="w-5 h-5" /> Verify & Register
              </>
            ) : (
              <>
                 <ShieldCheck className="w-5 h-5" /> Confirm OTP
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;