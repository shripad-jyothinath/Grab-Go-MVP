import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, Restaurant } from '../types';
import { ShoppingBag, Search, Plus, Minus, Clock, CheckCircle2, Hash, ArrowLeft, Store, ArrowRight } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { menu, addToCart, cart, removeFromCart, updateCartQuantity, clearCart, placeOrder, logout, user, orders, restaurants } = useApp();
  
  // State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [pickupTime, setPickupTime] = useState('12:00');

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
    placeOrder(selectedRestaurant.id, cart, cartTotal, pickupTime);
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
          <button onClick={() => setShowCart(false)} className="text-slate-500 font-medium">
            ← Back
          </button>
          <h1 className="text-lg font-bold flex-1 text-center">Your Order</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>

        <div className="p-4 pb-32">
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
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Time</label>
                   <input 
                    type="time" 
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                   />
                </div>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
               </div>
               <button
                 onClick={handleCheckout}
                 className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition"
               >
                 Place Order
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
            <button onClick={logout} className="text-sm text-slate-400">Logout</button>
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
                          <p className="text-sm text-slate-500">{order.items.length} items • {order.status}</p>
                       </div>
                       <div className="bg-indigo-50 px-3 py-1 rounded text-indigo-700 font-mono font-bold">
                          #{order.displayId}
                       </div>
                    </div>
                  )
               })}
             </div>
           )}

           <div className="grid gap-6">
             {restaurants.map(r => (
               <div 
                 key={r.id}
                 onClick={() => handleRestaurantSelect(r)}
                 className="bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden border border-slate-100 group"
               >
                 <div className="h-40 overflow-hidden relative">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                       <h3 className="text-white text-xl font-bold">{r.name}</h3>
                       <p className="text-white/80 text-sm">{r.cuisine}</p>
                    </div>
                 </div>
                 <div className="p-4 flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">View Menu</span>
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  // --- Menu View ---
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Menu Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <button onClick={handleBackToRestaurants} className="p-1 -ml-1 text-slate-500 hover:text-slate-800">
             <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
             <h1 className="text-lg font-bold text-slate-800">{selectedRestaurant.name}</h1>
             <p className="text-xs text-slate-500">{selectedRestaurant.cuisine}</p>
          </div>
        </div>
        
        <div className="px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${selectedRestaurant.name}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu List */}
      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMenu.length === 0 ? (
           <div className="col-span-full py-10 text-center text-slate-400">
              <p>No items found.</p>
           </div>
        ) : (
          filteredMenu.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-bold">${item.price.toFixed(2)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{item.category}</span>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => addToCart(item)}
                  className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform"
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

      {/* Order Success Toast */}
      {orderPlaced && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          Order Placed Successfully!
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;