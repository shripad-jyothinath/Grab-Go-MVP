import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChefHat, GraduationCap, Lock, Mail, User, Phone, Loader2, Store, AlertCircle, ArrowRight, Wallet } from 'lucide-react';

const Login: React.FC = () => {
  const { login, signup, loading } = useApp();
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Registration Role
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [upiId, setUpiId] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        if (authMode === 'signin') {
            const { error } = await login(email, password);
            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    setError("Please check your email to confirm your account.");
                } else {
                    setError(error.message);
                }
            }
        } else {
            // SignUp
            const { error } = await signup(email, password, name, phone, role, { restaurantName, upiId });
            if (error) setError(error.message);
            else {
                alert("Account created! You may need to verify your email depending on system settings.");
                setAuthMode('signin');
            }
        }
    } catch (err: any) {
        setError(err.message || "An error occurred");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-indigo-600"></div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Grab&Go</h1>
          <p className="text-slate-500">Order ahead, skip the line.</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex justify-center gap-6 mb-6 border-b border-slate-100 pb-2">
            <button onClick={() => setAuthMode('signin')} className={`text-sm font-bold pb-2 transition ${authMode === 'signin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                Login
            </button>
            <button onClick={() => setAuthMode('signup')} className={`text-sm font-bold pb-2 transition ${authMode === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                Sign Up
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> 
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           
           {/* Sign Up Role Selection */}
           {authMode === 'signup' && (
               <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button type="button" onClick={() => setRole('customer')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${role === 'customer' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>
                      <GraduationCap className="w-3 h-3" /> Student
                  </button>
                  <button type="button" onClick={() => setRole('restaurant_owner')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${role === 'restaurant_owner' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                      <Store className="w-3 h-3" /> Restaurant
                  </button>
               </div>
           )}

           {authMode === 'signup' && (
               <>
                <div>
                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">Full Name</label>
                    <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <User className="w-4 h-4 text-slate-400 mr-2" />
                        <input required className="bg-transparent w-full outline-none text-slate-800" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                    </div>
                </div>
                <div>
                    <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">Phone</label>
                     <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <Phone className="w-4 h-4 text-slate-400 mr-2" />
                        <input type="tel" required className="bg-transparent w-full outline-none text-slate-800" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
                    </div>
                </div>
                {role === 'restaurant_owner' && (
                    <>
                    <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">Restaurant Name</label>
                        <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                            <Store className="w-4 h-4 text-slate-400 mr-2" />
                            <input required className="bg-transparent w-full outline-none text-slate-800" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Tasty Bites" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">UPI ID (For Payments)</label>
                        <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                            <Wallet className="w-4 h-4 text-slate-400 mr-2" />
                            <input required className="bg-transparent w-full outline-none text-slate-800" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="merchant@upi" />
                        </div>
                    </div>
                    </>
                )}
               </>
           )}

           <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">Email</label>
                <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <Mail className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="email" required className="bg-transparent w-full outline-none text-slate-800" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>
           </div>

           <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs uppercase">Password</label>
                <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="password" required className="bg-transparent w-full outline-none text-slate-800" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
           </div>

           <button disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200 mt-4">
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'signin' ? 'Login' : 'Create Account')}
           </button>

        </form>
      </div>
    </div>
  );
};

export default Login;