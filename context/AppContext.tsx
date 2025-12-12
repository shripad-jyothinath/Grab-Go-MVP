import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  apiCreateOrder, 
  apiMarkPaid, 
  apiCompleteOrder, 
  fetchUserProfile, 
  fetchRestaurantByOwner, 
  apiUpdateOrderStatus,
  apiAddMenuItem,
  apiDeleteMenuItem,
  apiSignup,
  checkAdminPrivileges
} from '../services/api';
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
  
  // Menu Management
  addMenuItem: (item: Omit<MenuItem, 'id' | 'created_at'>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  
  // Admin Actions
  deleteRestaurant: (id: string) => Promise<void>;
  approveRestaurant: (id: string) => Promise<void>;
  getRestaurantStats: (restaurantId: string) => { averageRating: number; reviewCount: number };
  
  // System Config
  isTestMode: boolean;
  toggleTestMode: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  
  // Misc
  notifications: AppNotification[];
  ratings: Rating[]; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Mock Data for Test Mode ---
const TEST_RESTAURANTS: Restaurant[] = [
    {
        id: 'test-r1',
        owner_id: 'test-owner',
        name: '[TEST] Burger Joint',
        cuisine: 'Fast Food',
        verified: true,
        banned: false,
        payment_method: 'upi',
        created_at: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800'
    },
    {
        id: 'test-r2',
        owner_id: 'test-owner',
        name: '[TEST] Pizza Palace',
        cuisine: 'Italian',
        verified: true,
        banned: false,
        payment_method: 'upi',
        created_at: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'
    }
];

const CONFIG_REST_NAME = '__APP_CONFIG__';

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

  const [isTestMode, setIsTestMode] = useState(false);

  // --- Initialization & Data Fetching ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) setUser(profile);
        
        if (profile?.role === 'restaurant_owner') {
           const rest = await fetchRestaurantByOwner(profile.id);
           if (rest && mounted) setRestaurant(rest);
        }
      }

      await refreshRestaurants(mounted);

      // 3. Fetch Menu Items (All for now, filter in UI)
      const { data: mData } = await supabase.from('menu_items').select('*');
      if (mData && mounted) setMenu(mData as any);
      
      if (mounted) setLoading(false);
    };

    init();

    // 4. Realtime Subscription for Orders & Restaurants (to catch config changes)
    const orderChannel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
         refreshOrders(); // Refetch on any change for simplicity
      })
      .subscribe();

    const restChannel = supabase.channel('public:restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
         refreshRestaurants(true);
      })
      .subscribe();

    const menuChannel = supabase.channel('public:menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
          const { data } = await supabase.from('menu_items').select('*');
          if (data) setMenu(data as any);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(restChannel);
    };
  }, []);

  // --- Notification Permission ---
  useEffect(() => {
    if (user) {
        // Request notification permission when user is logged in
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }
    }
  }, [user]);

  const refreshRestaurants = async (mounted: boolean) => {
      // Fetch Restaurants
      const { data: rData } = await supabase.from('restaurants').select('*');
      if (rData && mounted) {
          // Check for config row
          const configRow = rData.find((r: any) => r.name === CONFIG_REST_NAME);
          const testModeActive = configRow ? configRow.banned : false;
          setIsTestMode(testModeActive);

          // Add fallback images if missing from DB, and filter out config row
          let mapped = rData
            .filter((r: any) => r.name !== CONFIG_REST_NAME)
            .map((r: any) => ({
              ...r,
              image: r.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
              cuisine: r.cuisine || 'Multi-Cuisine'
            }));
          
          // Inject Test Restaurants if mode is active
          if (testModeActive) {
             mapped = [...mapped, ...TEST_RESTAURANTS];
          }

          setRestaurants(mapped);
      }
  };

  const refreshOrders = async () => {
      if (!user) return;
      
      let query = supabase.from('orders').select('*, profiles(name, phone)');
      
      if (user.role === 'restaurant_owner' && restaurant) {
          query = query.eq('restaurant_id', restaurant.id);
      } else if (user.role === 'customer') {
          query = query.eq('customer_id', user.id);
      } else if (user.role === 'admin') {
          // Admin sees all
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setOrders(data as any);
  };

  useEffect(() => {
      if (user) refreshOrders();
  }, [user, restaurant]);

  // --- Auth ---
  const login = async (email: string, pass: string) => {
    // 1. Admin Bypass: Skip Supabase auth/email verification for specific admin credentials
    if (checkAdminPrivileges(email, pass)) {
         const adminProfile: Profile = {
            id: 'master-admin-bypass',
            name: 'Administrator',
            role: 'admin',
            banned: false,
            created_at: new Date().toISOString()
         };
         setUser(adminProfile);
         return { data: { user: adminProfile }, error: null };
    }

    // 2. Standard Login
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
    return apiSignup(email, pass, name, phone, role, extra);
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
      try {
         await apiMarkPaid(orderId);
         // UI update handled by realtime or optimistic
         setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paid: true } : o));
      } catch (e) { console.error(e); alert("Failed to mark paid"); }
  };

  const markOrderReady = async (orderId: string) => {
      await apiUpdateOrderStatus(orderId, 'ready');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o));
  };

  const completeOrder = async (orderId: string, code: string) => {
      try {
          await apiCompleteOrder(orderId, code);
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      } catch (e) {
          console.error(e);
          throw e; // Bubble up for alert
      }
  };
  
  // --- Menu Management ---
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
      const newItem = await apiAddMenuItem(item);
      setMenu(prev => [...prev, newItem]);
  };

  const deleteMenuItem = async (id: string) => {
      await apiDeleteMenuItem(id);
      setMenu(prev => prev.filter(i => i.id !== id));
  };

  // --- Admin Actions ---
  const deleteRestaurant = async (id: string) => {
     await supabase.from('restaurants').delete().eq('id', id);
     setRestaurants(prev => prev.filter(r => r.id !== id));
  };

  const approveRestaurant = async (id: string) => {
     await supabase.from('restaurants').update({ verified: true }).eq('id', id);
     setRestaurants(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
  };

  const getRestaurantStats = (restaurantId: string) => {
     const relevantRatings = ratings.filter(r => r.restaurantId === restaurantId);
     const count = relevantRatings.length;
     const avg = count > 0 ? relevantRatings.reduce((sum, r) => sum + r.rating, 0) / count : 0;
     return { averageRating: avg, reviewCount: count };
  };

  // --- System Config Logic ---
  const toggleTestMode = async () => {
    try {
        // 1. Fetch current config row
        const { data: existing } = await supabase.from('restaurants').select('*').eq('name', CONFIG_REST_NAME).single();
        
        const newStatus = !isTestMode;

        if (!existing) {
            // Create Config Row if missing
            
            // HACK: To bypass FK constraints on owner_id if we are using a fake admin account,
            // we try to find a real user ID from the profiles table to assign this row to.
            // If the user is logging in via bypass, 'user.id' is 'master-admin-bypass', which doesn't exist in auth.users.
            let ownerId = user?.id;
            
            if (user?.id === 'master-admin-bypass') {
                const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
                if (profiles && profiles.length > 0) {
                    ownerId = profiles[0].id;
                } else {
                    // Fallback, might fail FK if no users exist
                    console.warn("No real users found to assign config row ownership. DB Write might fail.");
                }
            }

            const { error } = await supabase.from('restaurants').insert([{
                owner_id: ownerId,
                name: CONFIG_REST_NAME,
                payment_method: 'upi',
                verified: false,
                banned: newStatus // Use banned col as the toggle
            }]);
            
            if (error) throw error;

        } else {
            // Update existing
            const { error } = await supabase.from('restaurants').update({ banned: newStatus }).eq('id', existing.id);
            if (error) throw error;
        }

        // Optimistic update
        setIsTestMode(newStatus);
        
        // Refresh to ensure sync
        await refreshRestaurants(true);
    } catch (e: any) {
        console.error("Failed to toggle Test Mode:", e);
        // Alert the user so they know why it reverted
        alert("Failed to save Test Mode state. \n\nThis usually happens if you are in Admin Bypass mode but the database requires a real user for Foreign Key constraints. \n\nError: " + (e.message || "Permissions/Network error"));
        // Revert state by refreshing from source of truth
        refreshRestaurants(true);
    }
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
      addMenuItem, deleteMenuItem,
      deleteRestaurant, approveRestaurant, getRestaurantStats,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      notifications, ratings,
      isTestMode, toggleTestMode
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