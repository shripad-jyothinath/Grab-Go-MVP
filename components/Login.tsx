import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChefHat, GraduationCap, Lock, Mail, User, Phone, Loader2, Store, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login, signup, loading } = useApp();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState(''); // For restaurant signup

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        if (mode === 'signin') {
            const { error } = await login(email, password);
            if (error) setError(error.message);
        } else {
            const extra = role === 'restaurant_owner' ? { restaurantName } : undefined;
            const { error } = await signup(email, password, name, phone, role, extra);
            if (error) setError(error.message);
            else {
                alert("Sign up successful! Please check your email to confirm.");
                setMode('signin');
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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-indigo-600"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CampusCrave</h1>
          <p className="text-slate-500">{mode === 'signin' ? 'Welcome back' : 'Create an account'}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button onClick={() => setMode('signin')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'signin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Sign In</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'signup' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Sign Up</button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           {mode === 'signup' && (
               <div className="grid grid-cols-2 gap-3 mb-2">
                   <button type="button" onClick={() => setRole('customer')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 ${role === 'customer' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400'}`}>
                       <GraduationCap className="w-5 h-5" /> <span className="text-xs font-bold">Student</span>
                   </button>
                   <button type="button" onClick={() => setRole('restaurant_owner')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 ${role === 'restaurant_owner' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                       <ChefHat className="w-5 h-5" /> <span className="text-xs font-bold">Restaurant</span>
                   </button>
               </div>
           )}

           <div>
                <label className="block text-slate-700 font-bold mb-1 text-sm">Email</label>
                <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                    <Mail className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="email" required className="bg-transparent w-full outline-none text-slate-800" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@university.edu" />
                </div>
           </div>

           <div>
                <label className="block text-slate-700 font-bold mb-1 text-sm">Password</label>
                <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="password" required className="bg-transparent w-full outline-none text-slate-800" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
           </div>

           {mode === 'signup' && (
               <>
                <div>
                        <label className="block text-slate-700 font-bold mb-1 text-sm">Full Name</label>
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                            <User className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="text" required className="bg-transparent w-full outline-none text-slate-800" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                        </div>
                </div>
                <div>
                        <label className="block text-slate-700 font-bold mb-1 text-sm">Phone</label>
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                            <Phone className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="tel" required className="bg-transparent w-full outline-none text-slate-800" value={phone} onChange={e => setPhone(e.target.value)} placeholder="1234567890" />
                        </div>
                </div>
                {role === 'restaurant_owner' && (
                    <div>
                        <label className="block text-slate-700 font-bold mb-1 text-sm">Restaurant Name</label>
                        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                            <Store className="w-4 h-4 text-slate-400 mr-2" />
                            <input type="text" required className="bg-transparent w-full outline-none text-slate-800" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Campus Grill" />
                        </div>
                    </div>
                )}
               </>
           )}

           <button disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
           </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
