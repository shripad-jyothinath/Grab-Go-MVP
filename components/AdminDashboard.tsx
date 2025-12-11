import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  LogOut, 
  Store, 
  Trash2, 
  TrendingUp, 
  ShoppingBag,
  Users
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { logout, restaurants, deleteRestaurant, orders, user } = useApp();

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;

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
            <span className="text-sm text-slate-400">Welcome, {user?.name}</span>
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
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Restaurants</p>
              <p className="text-2xl font-bold text-slate-800">{restaurants.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Restaurant Management */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Restaurant Management
            </h2>
            <span className="text-xs font-mono text-slate-400 uppercase">System Data</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3">Restaurant Name</th>
                  <th className="px-6 py-3">Cuisine</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No registered restaurants found.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200">
                             <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-semibold text-slate-700">{restaurant.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {restaurant.cuisine}
                      </td>
                      <td className="px-6 py-4 text-right">
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
                      </td>
                    </tr>
                  ))
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