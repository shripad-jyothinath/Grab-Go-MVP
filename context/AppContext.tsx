import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { apiCreateOrder, apiMarkPaid, apiCompleteOrder, fetchUserProfile, fetchRestaurantByOwner } from '../services/api';
import { Profile, Restaurant, MenuItem, Order, CartItem, AppNotification, Rating } from '../types';

interface AppContextType {
  user: Profile | null;
  restaurant: Restaurant | null; // If user is owner
  loading: boolean;
  
  // Auth
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string, phone: string, role: Profile['role'], extra?: any) => Promise<any>;
  logout: () => Promise<void>;

  // Data
  restaurants: Restaurant[];
  menu: MenuItem[];
  orders: Order[];
  
  // Actions
  placeOrder: (restaurantId: string, items: CartItem[], total: number) => Promise<any>;
  markOrderPaid: (orderId: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string, code: string) => Promise<void>;
  
  // Admin Actions
  deleteRestaurant: (id: string) => Promise<void>;
  approveRestaurant: (id: string) => Promise<void>;
  getRestaurantStats: (restaurantId: string) => { averageRating: number; reviewCount: number };

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  
  // Misc
  notifications: AppNotification[];
  ratings: Rating[]; // Keeping ratings local for now as schema wasn't provided, or fetch from DB if needed
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Simulation Data Fallbacks (Used if Supabase is not configured)
const MOCK_RESTAURANTS: Restaurant[] = [
    { id: 'r1', owner_id: 'o1', name: 'Campus Grill', cuisine: 'Burgers', verified: true, banned: false, payment_method: 'upi', upi_id: 'campusgrill@upi', created_at: '', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800' },
    { id: 'r2', owner_id: 'o2', name: 'Green Leaf', cuisine: 'Vegan', verified: true, banned: false, payment_method: 'upi', upi_id: 'greenleaf@upi', created_at: '', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800' }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  // --- Initialization ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch Profile
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) setUser(profile);
        
        // If Restaurant Owner, fetch Restaurant
        if (profile?.role === 'restaurant_owner') {
           const rest = await fetchRestaurantByOwner(profile.id);
           if (rest && mounted) setRestaurant(rest);
        }
      } else if (!process.env.SUPABASE_URL) {
         // SIMULATION MODE: If no env vars, simulate a user state if wanted, or just load mock data
         setRestaurants(MOCK_RESTAURANTS);
      }

      // 2. Fetch Global Data (Restaurants)
      if (process.env.SUPABASE_URL) {
          const { data: rData } = await supabase.from('restaurants').select('*'); // Removed .eq('verified', true) so admin can see unverified ones too. Filtering happens in UI if needed for students.
          if (rData && mounted) setRestaurants(rData as any);
      }
      
      if (mounted) setLoading(false);
    };

    init();

    // 3. Realtime Subscription for Orders
    // Only subscribe if we are logged in.
    const channel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
         // In a real app, we'd handle UPDATE/INSERT carefully to merge with local state
         // For now, simpler to just refetch relevant orders or append
         console.log('Order Change:', payload);
         // Simplified: In a real app, you'd refresh the order list here
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Fetch Logic Helpers ---
  const refreshOrders = async () => {
      if (!user) return;
      if (!process.env.SUPABASE_URL) return; // Skip in sim mode

      let query = supabase.from('orders').select('*, profiles(name, phone)');
      
      if (user.role === 'restaurant_owner' && restaurant) {
          query = query.eq('restaurant_id', restaurant.id);
      } else {
          // For customers and admins (if admins need to see all, logic would be different)
          // Assuming admins see stats via aggregate, not this user-specific order fetch for now
          query = query.eq('customer_id', user.id);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setOrders(data as any);
  };

  useEffect(() => {
      if (user) refreshOrders();
  }, [user, restaurant]);


  // --- Auth ---
  const login = async (email: string, pass: string) => {
    if (!process.env.SUPABASE_URL) {
         // Simulation Login
         setUser({ id: 'sim-user', name: 'Sim User', role: 'customer', banned: false, created_at: '' });
         return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!error && data.session) {
         const profile = await fetchUserProfile(data.session.user.id);
         setUser(profile);
         if (profile?.role === 'restaurant_owner') {
             const rest = await fetchRestaurantByOwner(profile.id);
             setRestaurant(rest);
         }
    }
    return { data, error };
  };

  const signup = async (email: string, pass: string, name: string, phone: string, role: Profile['role'], extra?: any) => {
    if (!process.env.SUPABASE_URL) {
        return { error: { message: "Cannot signup in simulation mode without backend." } };
    }

    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { error };
    
    if (data.user) {
        // Create Profile
        const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            name,
            phone,
            role
        }]);
        if (profileError) return { error: profileError };

        // If Restaurant, create Restaurant row
        if (role === 'restaurant_owner') {
             const { error: restError } = await supabase.from('restaurants').insert([{
                 owner_id: data.user.id,
                 name: extra.restaurantName,
                 payment_method: 'upi', // Default
                 verified: false // Admin must verify
             }]);
             if (restError) return { error: restError };
        }
    }
    return { data, error: null };
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setRestaurant(null);
      setOrders([]);
  };

  // --- Orders ---
  const placeOrder = async (restaurantId: string, items: CartItem[], total: number) => {
      try {
        const response = await apiCreateOrder(restaurantId, items, total);
        if (response.ok && response.order) {
            // Optimistic Update
            setOrders(prev => [response.order, ...prev]);
            clearCart();
            return response;
        }
      } catch (e) {
          console.error(e);
          throw e;
      }
  };

  const markOrderPaid = async (orderId: string) => {
      // Manual override for UPI
      try {
         await apiMarkPaid(orderId);
         setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paid: true } : o));
      } catch (e) { console.error(e); alert("Failed to mark paid"); }
  };

  const markOrderReady = async (orderId: string) => {
      // Restaurant manually marking ready
      if (!process.env.SUPABASE_URL) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o));
          return;
      }
      // Direct DB update allowed for owner via RLS (or use an Edge Function if strict)
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
      refreshOrders();
  };

  const completeOrder = async (orderId: string, code: string) => {
      try {
          await apiCompleteOrder(orderId, code);
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      } catch (e) {
          console.error(e);
          throw e;
      }
  };

  // --- Admin Actions ---
  const deleteRestaurant = async (id: string) => {
     if (process.env.SUPABASE_URL) {
         await supabase.from('restaurants').delete().eq('id', id);
     }
     setRestaurants(prev => prev.filter(r => r.id !== id));
  };

  const approveRestaurant = async (id: string) => {
     if (process.env.SUPABASE_URL) {
         await supabase.from('restaurants').update({ verified: true }).eq('id', id);
     }
     setRestaurants(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
  };

  const getRestaurantStats = (restaurantId: string) => {
     const relevantRatings = ratings.filter(r => r.restaurantId === restaurantId);
     const count = relevantRatings.length;
     const avg = count > 0 ? relevantRatings.reduce((sum, r) => sum + r.rating, 0) / count : 0;
     return { averageRating: avg, reviewCount: count };
  };

  // --- Cart ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      if (prev.length > 0 && prev[0].restaurant_id !== item.restaurant_id) {
        if (!confirm("Start new basket? One restaurant at a time.")) return prev;
        return [{ ...item, quantity: 1 }];
      }
      const existing = prev.find(i => i.id === item.id);
      return existing 
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateCartQuantity = (id: string, d: number) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + d)} : i).filter(i => i.quantity > 0));
  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      user, restaurant, loading, login, signup, logout,
      restaurants, menu, orders,
      placeOrder, markOrderPaid, markOrderReady, completeOrder,
      deleteRestaurant, approveRestaurant, getRestaurantStats,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      notifications, ratings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};