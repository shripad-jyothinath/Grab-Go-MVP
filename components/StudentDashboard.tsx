import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Restaurant, MenuItem } from '../types';
import { ShoppingBag, Search, Plus, Minus, Zap, Bell, X, Star, ArrowRight, Store, ArrowLeft, QrCode, CheckCircle2, AlertTriangle } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, logout, restaurants, menu, cart, addToCart, removeFromCart, updateCartQuantity, placeOrder, clearCart, orders, isTestMode } = useApp();
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null); // For showing confirmation

  // --- Logic ---
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  const handleCheckout = async () => {
      if (!selectedRestaurant) return;
      
      // Block checkout if in Test Mode
      if (isTestMode) {
          alert("Test Mode Active: Payments are disabled. Maintenance in progress.");
          return;
      }

      try {
          const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
          const response = await placeOrder(selectedRestaurant.id, cart, total);
          
          if (response && response.order) {
              setLastOrder({
                  ...response.order, 
                  restaurant: selectedRestaurant 
              });
              setShowCart(false);
          }
      } catch (e) {
          alert("Order failed. Please try again.");
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
  
  // 1. Order Confirmation (Payment) Overlay
  if (lastOrder) {
      const isRazorpay = lastOrder.restaurant.payment_method === 'razorpay';
      const upiLink = !isRazorpay ? buildUpiLink(lastOrder.displayId || lastOrder.id.substr(0,4), lastOrder.pickup_code, lastOrder.total, lastOrder.restaurant) : '';

      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center animate-fade-in-up">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
                  <p className="text-slate-500 mb-6">Pickup Code: <span className="font-mono font-bold text-slate-900 text-lg">{lastOrder.pickup_code}</span></p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Total Amount</p>
                      <p className="text-3xl font-bold text-slate-900">₹{lastOrder.total.toFixed(2)}</p>
                  </div>

                  {isRazorpay ? (
                      <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mb-4">
                          Pay with Razorpay
                      </button>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-sm text-slate-500">Scan to pay via UPI</p>
                          {/* Simple QR Code Generation using API for prototype */}
                          <div className="bg-white p-2 inline-block rounded-xl border border-slate-100 shadow-sm">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`} 
                                alt="UPI QR" 
                                className="w-40 h-40 mix-blend-multiply" 
                              />
                          </div>
                          <a href={upiLink} className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl">
                              Pay via UPI App
                          </a>
                          <p className="text-xs text-slate-400">The note is pre-filled with your Order ID & Pickup Code.</p>
                      </div>
                  )}

                  <button onClick={() => setLastOrder(null)} className="mt-6 text-slate-500 font-medium hover:text-slate-800">
                      Close & View Status
                  </button>
              </div>
          </div>
      );
  }

  // 2. Cart View
  if (showCart) {
      const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return (
          <div className="min-h-screen bg-white pb-20">
              <header className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center">
                  <button onClick={() => setShowCart(false)} className="p-2"><ArrowLeft className="w-5 h-5" /></button>
                  <h1 className="text-lg font-bold flex-1 text-center">Your Cart</h1>
                  <div className="w-9"></div>
              </header>
              <div className="p-4 space-y-4">
                  {isTestMode && (
                      <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Payments are disabled during maintenance.</span>
                      </div>
                  )}
                  {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <div>
                              <p className="font-bold">{item.name}</p>
                              <p className="text-sm text-slate-500">₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-3">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><Minus className="w-4 h-4" /></button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><Plus className="w-4 h-4" /></button>
                          </div>
                      </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between text-xl font-bold mb-4">
                          <span>Total</span>
                          <span>₹{total.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={handleCheckout} 
                        disabled={isTestMode}
                        className={`w-full font-bold py-4 rounded-xl ${isTestMode ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white'}`}
                      >
                          {isTestMode ? 'Checkout Disabled' : 'Confirm Order'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // 3. Restaurant List
  if (!selectedRestaurant) {
      return (
          <div className="min-h-screen bg-slate-50 pb-20">
              <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                  <div>
                      <h1 className="font-bold text-xl">Grab&Go</h1>
                      <p className="text-sm text-slate-500">Welcome, {user?.name}</p>
                  </div>
                  <button onClick={logout} className="text-sm text-red-500">Logout</button>
              </header>

              <div className="p-4 space-y-6">
                  {/* Active Orders Widget */}
                  {activeOrders.length > 0 && (
                      <div className="space-y-2">
                          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Active Orders</h2>
                          {activeOrders.map(o => (
                              <div key={o.id} className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-slate-800">Order #{o.pickup_code}</p>
                                      <p className="text-xs text-slate-500 capitalize">{o.status} • {o.paid ? 'Paid' : 'Unpaid'}</p>
                                  </div>
                                  <div className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{o.pickup_code}</div>
                              </div>
                          ))}
                      </div>
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
                                          TEST MODE
                                      </div>
                                  )}
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // 4. Menu View
  const restaurantItems = menu.filter(m => m.restaurant_id === selectedRestaurant.id);
  
  return (
      <div className="min-h-screen bg-slate-50 pb-24">
          <div className="h-48 relative">
              <img src={selectedRestaurant.image} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedRestaurant(null)} className="absolute top-4 left-4 bg-white/30 backdrop-blur-md p-2 rounded-full text-white"><ArrowLeft className="w-5 h-5" /></button>
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

          {cart.length > 0 && (
              <div className="fixed bottom-6 left-0 right-0 px-4">
                  <button onClick={() => setShowCart(true)} className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{cart.length}</div>
                          <span>View Cart</span>
                      </div>
                      <span className="font-bold">₹{cart.reduce((s,i)=>s+(i.price*i.quantity),0)}</span>
                  </button>
              </div>
          )}
      </div>
  );
};

export default StudentDashboard;
