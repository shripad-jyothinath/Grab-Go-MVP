import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, MenuItem } from '../types';
import { decryptData } from '../lib/security';
import { 
    Bell, 
    CheckCircle2, 
    Hash, 
    Clock, 
    Wallet, 
    LogOut, 
    UtensilsCrossed, 
    Plus, 
    Trash2, 
    Camera, 
    Upload, 
    Loader2, 
    Sparkles, 
    ShieldAlert,
    ListChecks,
    QrCode,
    Settings,
    Save,
    XCircle,
    Check
} from 'lucide-react';
import { parseMenuFromImage } from '../services/geminiService';

const RestaurantDashboard: React.FC = () => {
  const { 
      user, restaurant, orders, notifications,
      markOrderPaid, markOrderReady, acceptOrder, declineOrder, deleteOrder, completeOrder, 
      logout, menu, addMenuItem, deleteMenuItem, updateRestaurantSettings 
  } = useApp();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'verify' | 'menu' | 'settings'>('orders');

  // Menu State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Settings State
  const [editUpi, setEditUpi] = useState('');
  const [decryptedUpi, setDecryptedUpi] = useState('Loading...');

  // Decrypt UPI when tab is active
  useEffect(() => {
      const loadUpi = async () => {
          if (restaurant?.upi_id) {
              if (restaurant.id.startsWith('test-')) {
                  // Test restaurants store plain mock ID
                  setDecryptedUpi(restaurant.upi_id);
              } else {
                  const val = await decryptData(restaurant.upi_id);
                  setDecryptedUpi(val || 'Error decrypting');
              }
          } else {
              setDecryptedUpi('Not Set');
          }
      };
      if (activeTab === 'settings') loadUpi();
  }, [activeTab, restaurant]);

  // Notifications Toast
  const [lastNotif, setLastNotif] = useState<string | null>(null);
  useEffect(() => {
      if (notifications.length > 0) {
          const latest = notifications[0];
          if (latest.id !== lastNotif && Date.now() - latest.timestamp < 5000) {
              setLastNotif(latest.id);
              // Simple browser alert for MVP or assume the UI updates are enough
          }
      }
  }, [notifications]);

  if (!restaurant) return <div className="p-10 text-center">Loading Restaurant Profile...</div>;

  // --- Verification Check ---
  if (!restaurant.verified) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
              <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">Verification Pending</h1>
                  <p className="text-slate-500 mb-6">
                      Thanks for registering <strong>{restaurant.name}</strong>. Your account is currently under review. 
                      You will be able to manage your menu and orders once an admin approves your restaurant.
                  </p>
                  <button onClick={logout} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                      Log Out
                  </button>
              </div>
          </div>
      );
  }

  const myOrders = orders.filter(o => o.restaurant_id === restaurant.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const myMenu = menu.filter(m => m.restaurant_id === restaurant.id);

  const handleVerifyCode = async (orderId: string) => {
      try {
          await completeOrder(orderId, verificationCode);
          setVerificationCode('');
          alert("Order Completed Successfully!");
      } catch (e) {
          alert("Invalid Pickup Code.");
      }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await updateRestaurantSettings({ upi_id: editUpi });
          alert("Settings Saved!");
          setEditUpi('');
          setDecryptedUpi('Updating...');
          setTimeout(() => setActiveTab('settings'), 500); // Trigger re-decrypt
      } catch (e: any) {
          alert("Failed: " + e.message);
      }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newItemName || !newItemPrice) return;
    try {
        await addMenuItem({
            restaurant_id: restaurant.id,
            name: newItemName,
            description: newItemDesc,
            price: parseFloat(newItemPrice),
            photo_url: '', // Default placeholder logic in display
        });
        setNewItemName('');
        setNewItemPrice('');
        setNewItemDesc('');
        setIsAddingItem(false);
    } catch (e: any) {
        alert("Error adding item: " + e.message);
    }
  };

  const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessingAI(true);
      try {
          // Convert to Base64
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = reader.result as string;
              // Extract just the data part (remove "data:image/jpeg;base64,")
              const base64Data = base64.split(',')[1];
              
              const parsedItems = await parseMenuFromImage(base64Data);
              
              if (parsedItems.length === 0) {
                  alert("Could not detect any menu items.");
                  return;
              }

              // Bulk Add (simulated loop)
              let addedCount = 0;
              for (const item of parsedItems) {
                  await addMenuItem({
                      restaurant_id: restaurant.id,
                      name: item.name,
                      description: item.description || (item.category ? `Category: ${item.category}` : ''),
                      price: item.price || 0,
                      photo_url: ''
                  });
                  addedCount++;
              }
              alert(`Successfully imported ${addedCount} items from the menu image!`);
              setIsProcessingAI(false);
          };
      } catch (e: any) {
          console.error(e);
          alert("Failed to process image: " + e.message);
          setIsProcessingAI(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 sticky top-0 z-10 shadow-md">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-xl font-bold">{restaurant.name}</h1>
                  <p className="text-slate-400 text-sm">Dashboard</p>
              </div>
              <button onClick={logout} className="text-xs bg-red-500/20 text-red-200 px-3 py-1 rounded-full"><LogOut className="w-3 h-3 inline mr-1" /> Logout</button>
          </div>
      </header>

      <main className="p-4">
          {activeTab === 'orders' && (
              <div className="space-y-4">
                  <h2 className="font-bold text-lg mb-2 flex items-center justify-between">
                      <span>Live Orders</span>
                      {notifications.length > 0 && notifications[0].read === false && (
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">New!</span>
                      )}
                  </h2>
                  {myOrders.length === 0 && <p className="text-center text-slate-400 py-10">No orders yet.</p>}
                  {myOrders.map(order => (
                      <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                          {/* Delete Button (Top Right) */}
                          <button 
                            onClick={() => { if(confirm("Delete this order?")) deleteOrder(order.id) }}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                          >
                              <XCircle className="w-4 h-4" />
                          </button>

                          <div className="flex justify-between items-start mb-3 pr-6">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg">PIN: {order.pickup_code}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          order.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                                          order.status === 'ready' ? 'bg-orange-100 text-orange-700' :
                                          order.status === 'declined' ? 'bg-red-100 text-red-700' :
                                          'bg-green-100 text-green-700'
                                      }`}>
                                          {order.status}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 font-mono">
                                        ID: {order.id.slice(0,8).toUpperCase()}
                                      </span>
                                      <span className="text-xs text-slate-500 ml-1">
                                         {new Date(order.created_at).toLocaleTimeString()}
                                      </span>
                                  </div>
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
                              {/* New Flow: Pending -> Accept/Decline */}
                              {order.status === 'pending' && (
                                  <>
                                    <button 
                                        onClick={() => acceptOrder(order.id)}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow-sm hover:bg-green-700"
                                    >
                                        <Check className="w-4 h-4" /> Accept
                                    </button>
                                    <button 
                                        onClick={() => declineOrder(order.id)}
                                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 border border-red-100 hover:bg-red-100"
                                    >
                                        <XCircle className="w-4 h-4" /> Decline
                                    </button>
                                  </>
                              )}

                              {order.status === 'accepted' && (
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
                              
                              {order.status === 'declined' && (
                                  <div className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-bold text-center border border-red-200">
                                      Declined
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'verify' && (
              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm text-center mt-10">
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
                  
                  <div className="text-left mt-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Ready Orders</h3>
                      {myOrders.filter(o => o.status === 'ready').map(o => (
                          <div key={o.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                              <div>
                                  <span className="font-bold mr-2">#{o.pickup_code}</span>
                                  <span className="text-xs text-slate-400 font-mono">({o.id.slice(0,6)})</span>
                              </div>
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

          {activeTab === 'menu' && (
              <div className="space-y-6">
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setIsAddingItem(true)}
                        className="bg-indigo-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 transition"
                      >
                          <Plus className="w-6 h-6" />
                          <span className="font-bold text-sm">Add Item</span>
                      </button>
                      <label className="bg-orange-600 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:bg-orange-700 transition cursor-pointer relative overflow-hidden">
                          {isProcessingAI ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                              <>
                                <Sparkles className="w-6 h-6" />
                                <span className="font-bold text-sm">Scan Menu</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAIImport} />
                              </>
                          )}
                      </label>
                  </div>

                  {/* Add Item Form Modal/Inline */}
                  {isAddingItem && (
                      <div className="bg-white p-4 rounded-xl shadow border border-slate-200 animate-fade-in">
                          <h3 className="font-bold mb-4">Add New Item</h3>
                          <form onSubmit={handleAddItem} className="space-y-3">
                              <input 
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                placeholder="Item Name (e.g. Veg Burger)"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                required
                              />
                              <input 
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                placeholder="Price (e.g. 150)"
                                type="number"
                                value={newItemPrice}
                                onChange={e => setNewItemPrice(e.target.value)}
                                required
                              />
                              <textarea 
                                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                placeholder="Description"
                                value={newItemDesc}
                                onChange={e => setNewItemDesc(e.target.value)}
                              />
                              <div className="flex gap-2 pt-2">
                                  <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 py-2 text-slate-500">Cancel</button>
                                  <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold">Save Item</button>
                              </div>
                          </form>
                      </div>
                  )}

                  {/* Menu List */}
                  <div>
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <UtensilsCrossed className="w-5 h-5 text-slate-500" /> Current Menu
                      </h2>
                      <div className="space-y-3">
                          {myMenu.length === 0 ? (
                              <p className="text-slate-400 text-sm">No items found. Add some items or scan a menu!</p>
                          ) : (
                              myMenu.map(item => (
                                  <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-slate-800">{item.name}</p>
                                          <p className="text-sm text-slate-500">₹{item.price}</p>
                                          {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>}
                                      </div>
                                      <button 
                                        onClick={() => {
                                            if(confirm('Delete this item?')) deleteMenuItem(item.id);
                                        }}
                                        className="text-red-400 hover:text-red-600 p-2"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="p-4 space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-slate-500" /> Payment Settings
                      </h2>
                      <form onSubmit={handleUpdateSettings}>
                          <div className="mb-4">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">UPI ID</label>
                              <div className="flex items-center gap-2">
                                  <input 
                                    className="w-full border p-2 rounded-lg outline-none focus:border-indigo-500"
                                    placeholder={decryptedUpi}
                                    value={editUpi}
                                    onChange={e => setEditUpi(e.target.value)}
                                  />
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                  Current (Decrypted): {decryptedUpi}
                              </p>
                          </div>
                          <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                              <Save className="w-4 h-4" /> Save
                          </button>
                      </form>
                  </div>
              </div>
          )}
      </main>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 safe-area-pb">
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'orders' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <ListChecks className="w-6 h-6" />
              <span className="text-[10px] font-bold">Orders</span>
          </button>
          <button onClick={() => setActiveTab('verify')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'verify' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <QrCode className="w-6 h-6" />
              <span className="text-[10px] font-bold">Verify</span>
          </button>
          <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'menu' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <UtensilsCrossed className="w-6 h-6" />
              <span className="text-[10px] font-bold">Menu</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-bold">Settings</span>
          </button>
      </div>
    </div>
  );
};

export default RestaurantDashboard;