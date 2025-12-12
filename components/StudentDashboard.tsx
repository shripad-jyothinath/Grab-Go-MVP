import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, Restaurant } from '../types';
import { ShoppingBag, Search, Plus, Minus, Clock, CheckCircle2, Hash, ArrowLeft, Store, ArrowRight, Zap, Bell, X } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { menu, addToCart, cart, removeFromCart, updateCartQuantity, clearCart, placeOrder, logout, user, orders, restaurants, notifications, markNotificationRead } = useApp();
  
  // State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [pickupTime, setPickupTime] = useState('12:00');
  const [orderMode, setOrderMode] = useState<'asap' | 'scheduled'>('asap');
  const [showNotifPermission, setShowNotifPermission] = useState(false);

  // Notifications for current user
  const myNotifications = notifications.filter(n => n.userId === user?.id && !n.read);

  useEffect(() => {
    // Check if permission is needed
    if ('Notification' in window && Notification.permission === 'default') {
        setShowNotifPermission(true);
    }
  }, []);

  const requestNotificationAccess = () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
             setShowNotifPermission(false);
        });
    } else {
        setShowNotifPermission(false);
    }
  };

  // Only show APPROVED restaurants
  const approvedRestaurants = restaurants.filter(r => r.isApproved);

  // Filter menu for the selected restaurant
  const restaurantMenu = useMemo(() => {
    if (!selectedRestaurant) return [];
    return menu.filter(item => item.restaurantId === selectedRestaurant.id);
  }, [menu, selectedRestaurant]);

  // Derived state for categories based on the filtered menu
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(restaurantMenu.map(item => item.category)))];
  }, [restaurantMenu]);

  const filteredMenu = useMemo(() => {
    return restaurantMenu.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [restaurantMenu, activeCategory, searchTerm]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (!selectedRestaurant) return;
    const finalPickupTime = orderMode === 'asap' ? 'ASAP' : pickupTime;
    placeOrder(selectedRestaurant.id, cart, cartTotal, finalPickupTime);
    setShowCart(false);
  };

  const handleRestaurantSelect = (r: Restaurant) => {
    // If cart has items from another restaurant, they will be handled by the addToCart logic or we can clear here.
    // For better UX, we just switch. The cart conflict is handled on "Add".
    setSelectedRestaurant(r);
    setActiveCategory('All');
    setSearchTerm('');
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
  }

  const myActiveOrders = orders.filter(o => o.studentName === user?.name && o.status !== 'completed' && o.status !== 'declined' && o.status !== 'cancelled');

  // --- Cart View ---
  if (showCart) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center gap-4 z-10">
          <button onClick={() => setShowCart(false)} className="text-slate-500 font-medium px-2 py-1">
            ← Back
          </button>
          <h1 className="text-lg font-bold flex-1 text-center">Your Order</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>

        <div className="p-4 pb-48">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Restaurant info in cart */}
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3">
                 <Store className="w-5 h-5 text-orange-600" />
                 <div>
                    <p className="text-xs text-orange-600 uppercase font-bold">Ordering from</p>
                    <p className="font-semibold text-slate-800">{selectedRestaurant?.name || 'Restaurant'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                    <div>
                      <h4 className="font-medium text-slate-800">{item.name}</h4>
                      <p className="text-orange-600 font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 active:scale-95 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                         onClick={() => updateCartQuantity(item.id, 1)}
                         className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 active:scale-95 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                {/* Order Type Toggle */}
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setOrderMode('asap')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                            orderMode === 'asap' 
                            ? 'bg-orange-100 text-orange-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Zap className="w-4 h-4" />
                        Order Now
                    </button>
                    <button
                        onClick={() => setOrderMode('scheduled')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                            orderMode === 'scheduled' 
                            ? 'bg-orange-100 text-orange-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Schedule
                    </button>
                </div>

                {orderMode === 'scheduled' ? (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Pickup Time</label>
                        <input 
                            type="time" 
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                ) : (
                    <div className="flex items-start gap-3 text-slate-600 bg-white p-4 rounded-lg border border-slate-200 animate-fade-in">
                        <Zap className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-slate-800">ASAP Preparation</p>
                            <p className="text-xs text-slate-500 mt-1">
                                The restaurant will start preparing your order immediately. 
                                Please head to the counter once you receive the "Ready" notification.
                            </p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-8">
            <div className="max-w-md mx-auto">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
               </div>
               <button
                 onClick={handleCheckout}
                 className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
               >
                 {orderMode === 'asap' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                 {orderMode === 'asap' ? 'Order Instantly' : 'Schedule Pickup'}
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Restaurant List View ---
  if (!selectedRestaurant) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 relative">
        
         {/* Notification Modal */}
        {showNotifPermission && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Don't Miss Your Food!</h3>
                    <p className="text-center text-slate-500 text-sm mb-6">
                        Enable notifications to know exactly when your order is accepted and ready for pickup.
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
                            className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-200"
                        >
                            Enable
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Floating Notifications */}
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {myNotifications.map(notif => (
                <div key={notif.id} className={`pointer-events-auto p-4 rounded-xl shadow-xl flex gap-3 items-start animate-fade-in-down border-l-4 ${
                    notif.type === 'error' ? 'bg-white border-red-500 text-red-900' :
                    notif.type === 'warning' ? 'bg-white border-yellow-500 text-yellow-900' :
                    notif.type === 'success' ? 'bg-white border-green-500 text-green-900' :
                    'bg-white border-blue-500 text-blue-900'
                }`}>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">{notif.title}</h4>
                        <p className="text-sm opacity-90">{notif.message}</p>
                    </div>
                    <button onClick={() => markNotificationRead(notif.id)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>

        {/* Header */}
        <header className="bg-white sticky top-0 z-10 px-4 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Hello, {user?.name}</h1>
              <p className="text-sm text-slate-500">Choose a place to eat</p>
            </div>
            <button onClick={logout} className="text-sm text-slate-400 px-2 py-1">Logout</button>
          </div>
        </header>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
           {/* Active Orders Summary if any */}
           {myActiveOrders.length > 0 && (
             <div className="mb-6">
               <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Orders</h2>
               {myActiveOrders.map(order => {
                  const rName = restaurants.find(r => r.id === order.restaurantId)?.name || 'Unknown';
                  return (
                    <div key={order.id} className="bg-white border-l-4 border-indigo-500 p-4 rounded-r-xl shadow-sm mb-2 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-slate-800">{rName}</p>
                          <p className="text-xs text-slate-500 mt-1">Status: <span className="font-semibold text-indigo-600 capitalize">{order.status}</span></p>
                       </div>
                       <div className="text-right">
                          <span className="block text-2xl font-mono font-bold text-slate-800">#{order.displayId}</span>
                          <span className="text-[10px] text-slate-400">Order ID</span>
                       </div>
                    </div>
                  );
               })}
             </div>
           )}

           <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Restaurants</h2>
           {approvedRestaurants.length === 0 ? (
               <div className="text-center py-10 text-slate-400">
                   <Store className="w-10 h-10 mx-auto mb-2 opacity-50" />
                   <p>No restaurants available yet.</p>
               </div>
           ) : (
               <div className="grid gap-4">
                 {approvedRestaurants.map(restaurant => (
                   <button 
                     key={restaurant.id}
                     onClick={() => handleRestaurantSelect(restaurant)}
                     className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden text-left hover:shadow-md transition active:scale-[0.99] group"
                   >
                     <div className="h-32 w-full bg-slate-200 relative">
                       <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-3 left-3 text-white">
                         <h3 className="font-bold text-lg">{restaurant.name}</h3>
                         <p className="text-xs opacity-90">{restaurant.cuisine}</p>
                       </div>
                     </div>
                     <div className="p-3 flex justify-between items-center">
                        <span className="text-sm text-slate-600 font-medium">View Menu</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                     </div>
                   </button>
                 ))}
               </div>
           )}
        </div>
      </div>
    );
  }

  // --- Menu View ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Image */}
      <div className="h-48 relative">
         <img src={selectedRestaurant?.image} alt={selectedRestaurant?.name} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
         <button 
            onClick={handleBackToRestaurants}
            className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition"
         >
            <ArrowLeft className="w-5 h-5" />
         </button>
         <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-bold">{selectedRestaurant?.name}</h1>
            <p className="text-sm opacity-90">{selectedRestaurant?.cuisine}</p>
         </div>
      </div>

      <div className="sticky top-0 z-10 bg-white shadow-sm">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
              <input 
                 type="text" 
                 placeholder="Search food..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 transition"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto p-4 pt-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === cat 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {filteredMenu.length === 0 ? (
           <div className="text-center py-10 text-slate-400">
              <p>No items found.</p>
           </div>
        ) : (
          filteredMenu.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{item.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                   <span className="font-bold text-slate-900">${item.price.toFixed(2)}</span>
                   <button 
                      onClick={() => addToCart(item)}
                      className="bg-orange-50 text-orange-600 hover:bg-orange-100 p-2 rounded-lg transition active:scale-90"
                   >
                      <Plus className="w-5 h-5" />
                   </button>
                </div>
              </div>
              {item.imageUrl && (
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
           <button 
             onClick={() => setShowCart(true)}
             className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.98] transition"
           >
              <div className="flex items-center gap-3">
                 <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {cartItemCount}
                 </div>
                 <span className="font-medium">View Cart</span>
              </div>
              <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;