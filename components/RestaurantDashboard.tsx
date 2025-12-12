import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { Bell, CheckCircle2, Hash, Clock, Wallet, LogOut } from 'lucide-react';

const RestaurantDashboard: React.FC = () => {
  const { user, restaurant, orders, markOrderPaid, markOrderReady, completeOrder, logout } = useApp();
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'verify'>('orders');

  if (!restaurant) return <div className="p-10 text-center">Loading Restaurant Profile...</div>;

  const myOrders = orders.filter(o => o.restaurant_id === restaurant.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleVerifyCode = async (orderId: string) => {
      try {
          await completeOrder(orderId, verificationCode);
          setVerificationCode('');
          alert("Order Completed Successfully!");
      } catch (e) {
          alert("Invalid Pickup Code.");
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-slate-900 text-white p-6">
          <div className="flex justify-between items-start mb-6">
              <div>
                  <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                  <p className="text-slate-400 text-sm">Owner Dashboard</p>
              </div>
              <button onClick={logout} className="text-xs bg-red-500/20 text-red-200 px-3 py-1 rounded-full"><LogOut className="w-3 h-3 inline mr-1" /> Logout</button>
          </div>
          
          <div className="flex gap-4 border-b border-slate-700">
              <button onClick={() => setActiveTab('orders')} className={`pb-2 ${activeTab === 'orders' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400'}`}>Live Orders</button>
              <button onClick={() => setActiveTab('verify')} className={`pb-2 ${activeTab === 'verify' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400'}`}>Pickup Verification</button>
          </div>
      </header>

      <main className="p-4">
          {activeTab === 'orders' ? (
              <div className="space-y-4">
                  {myOrders.length === 0 && <p className="text-center text-slate-400 py-10">No orders yet.</p>}
                  {myOrders.map(order => (
                      <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg">Order #{order.pickup_code}</span>
                                      {!order.paid && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">UNPAID</span>}
                                      {order.paid && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold">PAID</span>}
                                  </div>
                                  <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-xl">₹{order.total}</p>
                              </div>
                          </div>
                          
                          <div className="space-y-1 mb-4 border-t border-slate-50 pt-2">
                              {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                      <span>{item.quantity}x {item.name}</span>
                                      <span className="text-slate-500">₹{item.price * item.quantity}</span>
                                  </div>
                              ))}
                          </div>

                          <div className="flex gap-2">
                              {!order.paid && (
                                  <button 
                                    onClick={() => markOrderPaid(order.id)}
                                    className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                                  >
                                      <Wallet className="w-4 h-4" /> Mark Paid
                                  </button>
                              )}
                              
                              {order.status === 'pending' && order.paid && (
                                  <button 
                                    onClick={() => markOrderReady(order.id)}
                                    className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                                  >
                                      <Bell className="w-4 h-4" /> Mark Ready
                                  </button>
                              )}

                              {order.status === 'ready' && (
                                  <div className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-bold text-center border border-green-200">
                                      Ready for Pickup
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Hash className="w-6 h-6 text-slate-600" />
                  </div>
                  <h2 className="text-lg font-bold mb-2">Complete Order</h2>
                  <p className="text-sm text-slate-500 mb-6">Ask the student for their 4-digit pickup code.</p>
                  
                  <input 
                    type="tel" 
                    maxLength={4}
                    placeholder="0000" 
                    className="w-full text-center text-3xl font-mono tracking-widest border-2 border-slate-200 rounded-xl py-3 mb-4 focus:border-indigo-500 outline-none"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                  />

                  {/* We need to find the order ID associated with this code locally or API search. 
                      For prototype simplicity, we assume we select an order from the list or verify generic.
                      To make this robust, the API should accept CODE only.
                      Here, for UI, let's list READY orders below to click and verify.
                  */}
                  
                  <div className="text-left mt-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Ready Orders</h3>
                      {myOrders.filter(o => o.status === 'ready').map(o => (
                          <div key={o.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                              <span className="font-bold">#{o.pickup_code}</span>
                              <button 
                                onClick={() => completeOrder(o.id, verificationCode)}
                                className="bg-slate-900 text-white px-3 py-1 rounded text-sm"
                              >
                                  Verify
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </main>
    </div>
  );
};

export default RestaurantDashboard;
