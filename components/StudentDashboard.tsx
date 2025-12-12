import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, Restaurant } from '../types';
import { ShoppingBag, Search, Plus, Minus, Clock, CheckCircle2, Hash, ArrowLeft, Store, ArrowRight, Zap } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { menu, addToCart, cart, removeFromCart, updateCartQuantity, clearCart, placeOrder, logout, user, orders, restaurants } = useApp();
  
  // State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [pickupTime, setPickupTime] = useState('12:00');
  const [orderMode, setOrderMode] = useState<'asap' | 'scheduled'>('asap');

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
    setOrderPlaced(true);
    setShowCart(false);
    setTimeout(() => setOrderPlaced(false), 3000); // Reset toast after 3s
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

  const myActiveOrders = orders.filter(o => o.studentName === user?.name && o.status !== 'completed' && o.status !== 'declined');

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
      <div className="min-h-screen bg-slate-50 pb-24">
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
                          <p className="text-