import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Restaurant, MenuItem } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Zap, 
  Bell, 
  X, 
  Star, 
  ArrowRight, 
  Store, 
  ArrowLeft, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  Home,
  User,
  List,
  LogOut,
  Settings,
  ChevronRight,
  Save,
  Loader2,
  Lock
} from 'lucide-react';
import { TEST_RESTAURANTS } from '../context/AppContext';

const StudentDashboard: React.FC = () => {
  const { 
      user, logout, updateProfile, 
      restaurants, menu, cart, 
      addToCart, updateCartQuantity, placeOrder, clearCart, 
      orders, isTestMode, isTestUser, enableTestUser, loginAsTestRestaurant 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'cart' | 'profile'>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null); 
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Test User Activation State
  const [tapCount, setTapCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');

  // --- Logic ---
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleCheckout = async () => {
      // Check for Test Mode restriction
      if (isTestMode && !isTestUser) {
          alert("Maintenance Mode Active. Ordering is currently disabled.");
          return;
      }

      if (!selectedRestaurant) {
          const firstItem = cart[0];
          if(!firstItem) return;
          const rest = restaurants.find(r => r.id === firstItem.restaurant_id);
          if(rest) {
              await processOrder(rest);
          }
          return;
      }
      await processOrder(selectedRestaurant);
  };

  const processOrder = async (rest: Restaurant) => {
      try {
          const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
          const response = await placeOrder(rest.id, cart, total);
          
          if (response && response.order) {
              setLastOrder({
                  ...response.order, 
                  restaurant: rest 
              });
              setSelectedRestaurant(null);
              setActiveTab('home');
          }
      } catch (e) {
          alert("Order failed. Please try again.");
      }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await updateProfile(editName, editPhone);
          alert("Profile updated!");
          setShowSettings(false);
      } catch (e) {
          alert("Failed to update profile.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleVersionTap = () => {
      if (isTestUser) return;
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount === 5) {
          setShowPinModal(true);
          setTapCount(0);
      }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (enableTestUser(pinCode)) {
          alert("Test User Mode Activated!");
          setShowPinModal(false);
          setPinCode('');
      } else {
          alert("Invalid PIN");
          setPinCode('');
      }
  };

  const buildUpiLink = (orderId: string, pickupCode: string, total: number, rest: Restaurant) => {
      if (!rest.upi_id) return '#';
      const tn = `Order ${orderId} | Code ${pickupCode}`;
      const params = new URLSearchParams({
          pa: rest.upi_id,
          pn: rest.name,
          am: total.toString(),
          tn: tn,
          cu: 'INR'
      });
      return `upi://pay?${params.toString()}`;
  };

  // --- Renderers ---
  
  if (lastOrder) {
      const isRazorpay = lastOrder.restaurant.payment_method === 'razorpay';
      const upiLink = !isRazorpay ? buildUpiLink(lastOrder.displayId || lastOrder.id.substr(0,4), lastOrder.pickup_code, lastOrder.total, lastOrder.restaurant) : '';

      return (
          <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-6">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center animate-fade-in-up">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
                  
                  {lastOrder.is_test && (
                      <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                          TEST ORDER
                      </div>
                  )}

                  <p className="text-slate-500 mb-6">Pickup Code: <span className="font-mono font-bold text-slate-900 text-lg">{lastOrder.pickup_code}</span></p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Total Amount</p>
                      <p className="text-3xl font-bold text-slate-900">₹{lastOrder.total.toFixed(2)}</p>
                  </div>

                  <button onClick={() => setLastOrder(null)} className="mt-6 text-slate-500 font-medium hover:text-slate-800">
                      Close & View Status
                  </button>
              </div>
          </div>
      );
  }

  // Settings View
  if (showSettings) {
      return (
          <div className="min-h-screen bg-slate-50 pb-24 relative">
              <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                 <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                     <ArrowLeft className="w-6 h-6 text-slate-700" />
                 </button>
                 <h1 className="font-bold text-xl text-slate-800">Settings</h1>
              </header>

              <div className="p-4 space-y-6">
                  {/* Profile Edit */}
                  <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-slate-500" /> Personal Info
                      </h2>
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                              <input 
                                className="w-full border-b border-slate-200 py-2 outline-none focus:border-indigo-500" 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                              <input 
                                type="tel"
                                className="w-full border-b border-slate-200 py-2 outline-none focus:border-indigo-500" 
                                value={editPhone}
                                onChange={e => setEditPhone(e.target.value)}
                              />
                          </div>
                          <button disabled={isSaving} type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                          </button>
                      </div>
                  </form>

                  {/* Test Mode Control Panel (Only for Test Users) */}
                  {isTestUser && (
                      <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200 animate-fade-in">
                          <h2 className="font-bold text-lg mb-2 flex items-center gap-2 text-yellow-800">
                              <Zap className="w-5 h-5 fill-yellow-600 text-yellow-800" /> Test Mode Active
                          </h2>
                          <p className="text-xs text-yellow-700 mb-4">
                              You can order during maintenance and log in as test restaurants without passwords.
                          </p>
                          
                          <h3 className="font-bold text-sm text-yellow-800 mb-2">Simulate Login:</h3>
                          <div className="space-y-2">
                              {TEST_RESTAURANTS.map(tr => (
                                  <button 
                                    key={tr.id}
                                    onClick={() => loginAsTestRestaurant(tr.id)}
                                    className="w-full bg-white text-yellow-800 border border-yellow-200 py-3 px-4 rounded-lg flex justify-between items-center text-sm font-bold shadow-sm"
                                  >
                                      <span>Login as {tr.name}</span>
                                      <ChevronRight className="w-4 h-4" />
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* App Version / Hidden Trigger */}
                  <div className="pt-10 text-center pb-10">
                      <button 
                        onClick={handleVersionTap}
                        className="text-xs text-slate-400 font-medium focus:outline-none select-none"
                      >
                          Grab&Go App Version 1.0.2 <br />
                          Build 2024.10.25
                      </button>
                  </div>
              </div>

              {/* PIN Modal */}
              {showPinModal && (
                  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg">Enter Test Code</h3>
                              <button onClick={() => setShowPinModal(false)}><X className="w-5 h-5" /></button>
                          </div>
                          <form onSubmit={handlePinSubmit}>
                              <input 
                                type="password" 
                                pattern="[0-9]*" 
                                inputMode="numeric"
                                maxLength={4}
                                autoFocus
                                className="w-full text-center text-3xl tracking-widest border border-slate-300 rounded-xl py-3 mb-4"
                                value={pinCode}
                                onChange={e => setPinCode(e.target.value)}
                              />
                              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
                                  Unlock
                              </button>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // Menu View (Sub-view of Home)
  if (selectedRestaurant) {
    const restaurantItems = menu.filter(m => m.restaurant_id === selectedRestaurant.id);
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="h-48 relative">
                <img src={selectedRestaurant.image} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedRestaurant(null)} className="absolute top-4 left-4 bg-white/30 backdrop-blur-md p-2 rounded-full text-white z-10"><ArrowLeft className="w-5 h-5" /></button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                    <h1 className="text-2xl font-bold">{selectedRestaurant.name}</h1>
                    <p className="opacity-90">{selectedRestaurant.cuisine}</p>
                </div>
            </div>
            
            <div className="p-4 space-y-4">
                {restaurantItems.length === 0 && (
                    <div className="text-center text-slate-400 py-10">
                        <p>Menu items usually appear here.</p>
                        {selectedRestaurant.id.startsWith('test-') && <p className="text-xs">This is a mock restaurant.</p>}
                    </div>
                )}
                {restaurantItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                            <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">₹{item.price}</span>
                                <button onClick={() => addToCart(item)} className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {cart.length > 0 && cart[0].restaurant_id === selectedRestaurant.id && (
              <div className="fixed bottom-6 left-0 right-0 px-4 z-40">
                  <button onClick={() => { setSelectedRestaurant(null); setActiveTab('cart'); }} className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{cart.length}</div>
                          <span>View Basket</span>
                      </div>
                      <span className="font-bold">₹{cart.reduce((s,i)=>s+(i.price*i.quantity),0)}</span>
                  </button>
              </div>
            )}
        </div>
    );
  }

  // --- Main Render (Tab Views) ---
  return (
      <div className="min-h-screen bg-slate-50 pb-24">
          <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
             <div className="flex justify-between items-center">
                 <h1 className="font-bold text-xl text-slate-800">Grab&Go</h1>
                 {activeTab === 'home' && <p className="text-xs text-slate-500">Hi, {user?.name.split(' ')[0]}</p>}
             </div>
          </header>

          {/* HOME TAB */}
          {activeTab === 'home' && (
              <div className="p-4 space-y-4">
                  {activeOrders.length > 0 && (
                      <button onClick={() => setActiveTab('orders')} className="w-full bg-indigo-600 text-white p-3 rounded-xl flex items-center justify-between shadow-lg shadow-indigo-200">
                          <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 animate-pulse" />
                              <div className="text-left">
                                  <p className="font-bold text-sm">Order #{activeOrders[0].pickup_code} is live</p>
                                  <p className="text-xs opacity-80">Tap to view status</p>
                              </div>
                          </div>
                          <ArrowRight className="w-5 h-5" />
                      </button>
                  )}

                  <div className="grid gap-4">
                      {restaurants.map(r => (
                          <button key={r.id} onClick={() => setSelectedRestaurant(r)} className="bg-white rounded-xl shadow-sm overflow-hidden text-left group">
                              <div className="h-32 bg-slate-200 relative">
                                  <img src={r.image || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                  <div className="absolute bottom-3 left-3 text-white">
                                      <h3 className="font-bold text-lg">{r.name}</h3>
                                      <p className="text-xs opacity-90">{r.cuisine}</p>
                                  </div>
                                  {r.id.startsWith('test-') && (
                                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                          TEST
                                      </div>
                                  )}
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
              <div className="p-4 space-y-4">
                  <h2 className="font-bold text-lg">Your Orders</h2>
                  {orders.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No orders yet</p>
                      </div>
                  ) : (
                      orders.map(o => (
                        <div key={o.id} className={`p-4 rounded-xl border shadow-sm ${o.is_test ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-800">Order #{o.pickup_code}</p>
                                    <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()} at {new Date(o.created_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {o.is_test && <span className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-1 rounded">TEST</span>}
                                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {o.status}
                                    </span>
                                </div>
                            </div>
                            <div className="py-2 border-t border-slate-50 mt-2">
                                <p className="text-sm text-slate-600">{o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-bold">₹{o.total}</span>
                                <span className={`text-xs font-bold ${o.paid ? 'text-green-600' : 'text-red-500'}`}>{o.paid ? 'PAID' : 'UNPAID'}</span>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          )}

          {/* CART TAB */}
          {activeTab === 'cart' && (
              <div className="p-4 space-y-4">
                  <h2 className="font-bold text-lg">Your Cart</h2>
                  {isTestMode && !isTestUser && (
                      <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-red-800 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Maintenance Mode. Ordering Disabled.</span>
                      </div>
                  )}
                  {isTestMode && isTestUser && (
                      <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>Test User Active. Maintenance Override On.</span>
                      </div>
                  )}

                  {cart.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <p>Your cart is empty</p>
                          <button onClick={() => setActiveTab('home')} className="mt-4 text-indigo-600 font-bold">Browse Restaurants</button>
                      </div>
                  ) : (
                      <>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <div>
                                        <p className="font-bold">{item.name}</p>
                                        <p className="text-sm text-slate-500">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateCartQuantity(item.id, -1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.id, 1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mt-4">
                            <div className="flex justify-between text-xl font-bold mb-4">
                                <span>Total</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={handleCheckout} 
                                disabled={isTestMode && !isTestUser}
                                className={`w-full font-bold py-4 rounded-xl ${isTestMode && !isTestUser ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white'}`}
                            >
                                {isTestMode && !isTestUser ? 'Checkout Disabled' : (isTestMode ? 'Place Test Order' : 'Confirm Order')}
                            </button>
                        </div>
                      </>
                  )}
              </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
              <div className="p-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center mb-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4 text-slate-400">
                          <User className="w-10 h-10" />
                      </div>
                      <h2 className="font-bold text-xl">{user?.name}</h2>
                      <p className="text-slate-500 text-sm">{user?.phone || 'No phone'}</p>
                      {isTestUser && <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded mt-2">TEST USER ACTIVE</span>}
                  </div>
                  
                  <div className="space-y-3">
                      <button onClick={() => setShowSettings(true)} className="w-full bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                              <Settings className="w-5 h-5 text-slate-500" />
                              <span className="font-bold text-slate-700">Settings</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                      </button>

                      <button onClick={logout} className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                          <LogOut className="w-5 h-5" /> Logout
                      </button>
                  </div>
              </div>
          )}

          {/* BOTTOM NAVIGATION BAR */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 safe-area-pb">
              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
                  <span className="text-[10px] font-bold">Home</span>
              </button>
              <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'orders' ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <List className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Orders</span>
              </button>
              <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'cart' ? 'text-indigo-600' : 'text-slate-400'} relative`}>
                  <div className="relative">
                      <ShoppingBag className={`w-6 h-6 ${activeTab === 'cart' ? 'fill-current' : ''}`} />
                      {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold">{cart.length}</span>}
                  </div>
                  <span className="text-[10px] font-bold">Basket</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
                  <span className="text-[10px] font-bold">Profile</span>
              </button>
          </div>
      </div>
  );
};

export default StudentDashboard;