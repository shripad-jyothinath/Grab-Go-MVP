import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { parseMenuFromImage } from '../services/geminiService';
import { MenuItem, OrderStatus } from '../types';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ClipboardList,
  UtensilsCrossed,
  DollarSign,
  ChefHat,
  Bell,
  Hash,
  Camera,
  Edit2,
  Star
} from 'lucide-react';

const RestaurantDashboard: React.FC = () => {
  const { user, menu, setMenu, addMenuItem, deleteMenuItem, orders, updateOrderStatus, verifyOrderPickup, logout, restaurants, updateRestaurantImage, getRestaurantStats } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  
  // Menu State
  const [isProcessing, setIsProcessing] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Mains', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Verification State
  const [verificationInput, setVerificationInput] = useState<Record<string, string>>({});

  // Filtered Data based on Logged In Restaurant
  const restaurantOrders = orders.filter(o => o.restaurantId === user?.restaurantId);
  const restaurantMenu = menu.filter(m => m.restaurantId === user?.restaurantId);
  const currentRestaurant = restaurants.find(r => r.id === user?.restaurantId);
  
  // Rating Stats
  const stats = user?.restaurantId ? getRestaurantStats(user.restaurantId) : { averageRating: 0, reviewCount: 0 };

  // Notification Permission Popup
  const [showNotifPermission, setShowNotifPermission] = useState(false);

  useEffect(() => {
    // Check if permission is needed
    if ('Notification' in window && Notification.permission === 'default') {
        setShowNotifPermission(true);
    }
  }, []);

  const requestNotificationAccess = () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification("Notifications Enabled", { body: "You will now receive order updates!" });
            }
            setShowNotifPermission(false);
        });
    } else {
        setShowNotifPermission(false);
    }
  };

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.restaurantId) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extractedItems = await parseMenuFromImage(base64);
        
        // Add IDs to extracted items and attach current restaurant ID
        const itemsWithIds: MenuItem[] = extractedItems.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          restaurantId: user.restaurantId!
        }));
        
        // Append new items to global menu state
        // Note: setMenu replaces the entire global state, so we must combine existing global menu + new items
        setMenu([...menu, ...itemsWithIds]);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to read menu. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            updateRestaurantImage(result);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleManualAdd = () => {
    if (!newItem.name || !newItem.price || !user?.restaurantId) return;
    addMenuItem({
      id: Math.random().toString(36).substr(2, 9),
      restaurantId: user.restaurantId,
      name: newItem.name,
      description: newItem.description || '',
      price: Number(newItem.price),
      category: newItem.category || 'Mains'
    });
    setNewItem({ name: '', price: 0, category: 'Mains', description: '' });
  };

  const handleVerify = (orderId: string) => {
    const code = verificationInput[orderId];
    if (!code) return;
    
    const success = verifyOrderPickup(orderId, code);
    if (success) {
      setVerificationInput(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } else {
      alert("Incorrect Order ID");
    }
  };

  // --- Renderers ---

  const renderOrders = () => {
    const sortedOrders = [...restaurantOrders].sort((a, b) => b.timestamp - a.timestamp);

    if (sortedOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl font-medium">No orders yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedOrders.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition hover:shadow-md">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">{order.studentName}</h3>
                    <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1">
                       <Hash className="w-3 h-3" />
                       {order.displayId || '---'}
                    </div>
                 </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${order.status === 'accepted' ? 'bg-blue-100 text-blue-700' : ''}
                  ${order.status === 'ready' ? 'bg-indigo-100 text-indigo-700' : ''}
                  ${order.status === 'declined' ? 'bg-red-100 text-red-700' : ''}
                  ${order.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                  ${order.status === 'cancelled' ? 'bg-red-200 text-red-900' : ''}
                `}>
                  {order.status === 'ready' ? 'Ready for Pickup' : order.status}
                </span>
              </div>
              <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pickup: {order.pickupTime === 'ASAP' ? <span className="font-bold text-orange-600">ASAP (Prepare Instantly)</span> : order.pickupTime}
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.quantity}x {item.name}</span>
                    <span className="text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-orange-600 text-lg">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {order.status === 'pending' && (
              <div className="flex md:flex-col gap-2 justify-center">
                <button
                  onClick={() => updateOrderStatus(order.id, 'accepted')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-5 h-5" /> Accept
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, 'declined')}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                  <XCircle className="w-5 h-5" /> Decline
                </button>
              </div>
            )}
            
            {order.status === 'accepted' && (
               <button
               onClick={() => updateOrderStatus(order.id, 'ready')}
               className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition self-end flex items-center gap-2"
             >
               <Bell className="w-4 h-4" /> Mark Ready
             </button>
            )}

            {order.status === 'ready' && (
              <div className="flex flex-col gap-2 items-end justify-end mt-2 md:mt-0">
                  <div className="text-xs text-slate-500 font-medium text-right">
                    Student must provide Order ID<br/>
                    <span className="text-indigo-600 font-bold">#{order.displayId}</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        placeholder="12345"
                        className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-center font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                        maxLength={5}
                        value={verificationInput[order.id] || ''}
                        onChange={(e) => {
                            // Only allow numbers
                            if (/^\d*$/.test(e.target.value)) {
                                setVerificationInput(prev => ({...prev, [order.id]: e.target.value}))
                            }
                        }}
                    />
                    <button
                        onClick={() => handleVerify(order.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition active:bg-indigo-800"
                    >
                        Verify
                    </button>
                  </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMenuManager = () => (
    <div className="space-y-8">
      {/* AI Uploader */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-indigo-900 mb-1 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            AI Menu Builder
          </h3>
          <p className="text-indigo-700 text-sm">Upload a photo of your physical menu, and we'll digitize it instantly.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition disabled:opacity-70 active:scale-95"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isProcessing ? 'Analyzing Menu...' : 'Scan Menu Photo'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Manual Add */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Add Item Manually</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Item Name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={newItem.description}
              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            />
             <div className="flex gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={newItem.price}
                    onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  />
                </div>
                <select
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option>Mains</option>
                  <option>Starters</option>
                  <option>Sides</option>
                  <option>Drinks</option>
                  <option>Dessert</option>
                </select>
            </div>
            <button
              onClick={handleManualAdd}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Add Item
            </button>
          </div>
        </div>

        {/* Current Menu List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Current Menu ({restaurantMenu.length})</h3>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
            {restaurantMenu.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-start group active:bg-slate-50">
                <div>
                  <h4 className="font-semibold text-slate-800">{item.name}</h4>
                  <p className="text-xs text-slate-500 mb-1">{item.category}</p>
                  <p className="text-sm text-slate-600 line-clamp-1">{item.description}</p>
                  <p className="text-orange-600 font-bold mt-1">${item.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => deleteMenuItem(item.id)}
                  className="text-slate-400 hover:text-red-500 transition p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Notification Modal */}
      {showNotifPermission && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Enable Notifications?</h3>
                  <p className="text-center text-slate-500 text-sm mb-6">
                      Get instant alerts when you receive a new order so you never miss a beat.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowNotifPermission(false)}
                        className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium"
                      >
                          Later
                      </button>
                      <button 
                        onClick={requestNotificationAccess}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-200"
                      >
                          Enable
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header with Cover Image Edit */}
      <div className="bg-slate-800 text-white pb-16 relative">
          {/* Cover Image Simulation */}
          <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{ backgroundImage: `url(${currentRestaurant?.image})` }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>

          <div className="max-w-5xl mx-auto px-4 relative z-10 pt-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <ChefHat className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h1 className="text-xl font-bold">{user?.name}</h1>
                             <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold">{stats.averageRating.toFixed(1)}</span>
                                <span className="text-[10px] text-slate-300">({stats.reviewCount})</span>
                             </div>
                        </div>
                        <p className="text-slate-400 text-sm">Restaurant Dashboard</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={coverImageInputRef}
                        onChange={handleCoverImageUpload}
                    />
                    <button 
                        onClick={() => coverImageInputRef.current?.click()}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm transition"
                    >
                        <Edit2 className="w-3 h-3" /> Edit Cover
                    </button>
                    <button onClick={logout} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-full backdrop-blur-sm transition">
                        Log Out
                    </button>
                </div>
            </div>
            
             {/* Tabs moved inside header block */}
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pt-4 border-t border-white/10">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'orders' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Live Orders
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'menu' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Menu Management
                </button>
            </div>
          </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {activeTab === 'orders' ? renderOrders() : renderMenuManager()}
      </main>
    </div>
  );
};

export default RestaurantDashboard;