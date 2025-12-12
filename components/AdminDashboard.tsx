import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  LogOut, 
  Store, 
  Trash2, 
  TrendingUp, 
  ShoppingBag,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  ToggleLeft,
  ToggleRight,
  Beaker
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { logout, restaurants, deleteRestaurant, approveRestaurant, orders, user, getRestaurantStats, isTestMode, toggleTestMode } = useApp();

  // FILTER: Exclude test orders from stats
  const realOrders = orders.filter(o => !o.is_test);

  const totalRevenue = realOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = realOrders.length;

  const pendingRestaurants = restaurants.filter(r => !r.verified);
  const activeRestaurants = restaurants.filter(r => r.verified);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" />
            <h1 className="text-xl font-bold">
               Admin Console
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Test Mode Toggle */}
            <div className="flex items-center gap-2 mr-4 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
               <Beaker className={`w-4 h-4 ${isTestMode ? 'text-yellow-400' : 'text-slate-500'}`} />
               <span className="text-xs font-bold text-slate-300">Test Mode</span>
               <button onClick={toggleTestMode} className="focus:outline-none">
                  {isTestMode ? (
                      <ToggleRight className="w-8 h-8 text-yellow-400 transition" />
                  ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-500 transition" />
                  )}
               </button>
            </div>

            <span className="text-sm text-slate-400 hidden md:inline">Welcome, {user?.name}</span>
            <button 
              onClick={logout} 
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {isTestMode && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-bold">System in Test Mode</p>
              <p className="text-sm">Mock restaurants injected. Orders are saved to test environment and do not affect revenue stats.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Restaurants</p>
              <p className="text-2xl font-bold text-slate-800">{activeRestaurants.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Orders (Live)</p>
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Revenue (Live)</p>
              <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingRestaurants.length > 0 && (
          <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden mb-10">
             <div className="px-6 py-4 border-b border-yellow-100 flex justify-between items-center bg-yellow-50">
                <h2 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Pending Approvals
                </h2>
                <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                  Action Required ({pendingRestaurants.length})
                </span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {pendingRestaurants.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block">{r.name}</span>
                          <span className="text-xs text-slate-500">{r.cuisine}</span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-xs text-slate-400">ID: {r.id}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => approveRestaurant(r.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold mr-2 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => deleteRestaurant(r.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Active Restaurant Management */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Restaurant Management
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Restaurant Name</th>
                  <th className="px-6 py-3">Cuisine</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No active restaurants.
                    </td>
                  </tr>
                ) : (
                  activeRestaurants.map((restaurant) => {
                    const stats = getRestaurantStats(restaurant.id);
                    return (
                    <tr key={restaurant.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200">
                             <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-semibold text-slate-700">{restaurant.name}</span>
                          {restaurant.id.startsWith('test-') && (
                              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-mono">TEST</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {restaurant.cuisine}
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-bold text-slate-700">{stats.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-slate-400">({stats.reviewCount})</span>
                          </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!restaurant.id.startsWith('test-') ? (
                            <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${restaurant.name}? This action cannot be undone.`)) {
                                deleteRestaurant(restaurant.id);
                                }
                            }}
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                            title="Delete Restaurant"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Mock Data</span>
                        )}
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
