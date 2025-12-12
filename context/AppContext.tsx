import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  apiCreateOrder, 
  apiCreateTestOrder,
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
  updateProfile: (name: string, phone: string) => Promise<void>;

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

  // Test User Features
  isTestUser: boolean;
  enableTestUser: (code: string) => boolean;
  loginAsTestRestaurant: (restaurantId: string) => Promise<void>;

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
export const TEST_RESTAURANTS: Restaurant[] = [
    {
        id: 'test-r1',
        owner_id: 'test-owner-1',
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
        owner_id: 'test-owner-2',
        name: '[TEST] Pizza Palace',
        cuisine: 'Italian',
        verified: true,
        banned: false,
        payment_method: 'upi',
        created_at: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'
    }
];

const TEST_MENU_ITEMS: MenuItem[] = [
    { id: 'tm-1', restaurant_id: 'test-r1', name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheddar, lettuce, and tomato', price: 180, category: 'Burgers', created_at: new Date().toISOString() },
    { id: 'tm-2', restaurant_id: 'test-r1', name: 'Spicy Chicken Burger', description: 'Crispy chicken fillet with spicy mayo', price: 200, category: 'Burgers', created_at: new Date().toISOString() },
    { id: 'tm-3', restaurant_id: 'test-r1', name: 'Large Fries', description: 'Salted crispy golden fries', price: 120, category: 'Sides', created_at: new Date().toISOString() },
    { id: 'tm-4', restaurant_id: 'test-r1', name: 'Coke Zero', description: 'Chilled 300ml can', price: 60, category: 'Drinks', created_at: new Date().toISOString() },
    { id: 'tm-5', restaurant_id: 'test-r2', name: 'Margherita Pizza', description: 'Tomato sauce, mozzarella, and fresh basil', price: 350, category: 'Pizza', created_at: new Date().toISOString() },
    { id: 'tm-6', restaurant_id: 'test-r2', name: 'Pepperoni Feast', description: 'Loaded with double pepperoni slices', price: 450, category: 'Pizza', created_at: new Date().toISOString() },
    { id: 'tm-7', restaurant_id: 'test-r2', name: 'Garlic Breadsticks', description: 'Freshly baked with garlic butter', price: 150, category: 'Sides', created_at: new Date().toISOString() },
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
  
  // Persist Test User status in session storage
  const [isTestUser, setIsTestUser] = useState(() => {
      try {
          return sessionStorage.getItem('isTestUser') === 'true';
      } catch { return false; }
  });

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

      // Initial Menu Fetch handled by useEffect below dependent on isTestMode
      
      if (mounted) setLoading(false);
    };

    init();

    // 4. Realtime Subscription
    const orderChannel = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => refreshOrders())
      .subscribe();
      
    const restChannel = supabase.channel('public:restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => refreshRestaurants(true))
      .subscribe();

    const menuChannel = supabase.channel('public:menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => refreshMenu())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(restChannel);
    };
  }, []);

  const refreshRestaurants = async (mounted: boolean) => {
      const { data: rData } = await supabase.from('restaurants').select('*');
      if (rData && mounted) {
          const configRow = rData.find((r: any) => r.name === CONFIG_REST_NAME);
          const testModeActive = configRow ? configRow.banned : false;
          setIsTestMode(testModeActive);

          let mapped = rData
            .filter((r: any) => r.name !== CONFIG_REST_NAME)
            .map((r: any) => ({
              ...r,
              image: r.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
              cuisine: r.cuisine || 'Multi-Cuisine'
            }));
          
          if (testModeActive) {
             mapped = [...mapped, ...TEST_RESTAURANTS];
          }

          setRestaurants(mapped);
      }
  };

  const refreshMenu = async () => {
      const { data: mData } = await supabase.from('menu_items').select('*');
      let finalMenu = mData ? (mData as any[]) : [];
      
      if (isTestMode) {
          finalMenu = [...finalMenu, ...TEST_MENU_ITEMS];
      }
      setMenu(finalMenu);
  };

  // Re-fetch menu when Test Mode toggles to inject/remove test items
  useEffect(() => {
      refreshMenu();
  }, [isTestMode]);

  const refreshOrders = async () => {
      if (!user) return;
      
      // If user is a simulated test owner, fetch test orders for their specific ID
      if (user.id.startsWith('test-owner')) {
          const { data: testData } = await supabase.from('test_orders')
            .select('*')
            .eq('restaurant_id', restaurant?.id)
            .order('created_at', { ascending: false });
          
          if (testData) {
              const mapped = testData.map(t => ({ 
                  ...t, 
                  is_test: true, 
                  items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items // Handle potential stringification
              }));
              setOrders(mapped as any);
          }
          return;
      }

      // 1. Fetch Real Orders
      let query = supabase.from('orders').select('*, profiles(name, phone)');
      
      if (user.role === 'restaurant_owner' && restaurant) {
          query = query.eq('restaurant_id', restaurant.id);
      } else if (user.role === 'customer') {
          query = query.eq('customer_id', user.id);
      } 
      
      const { data: realOrders } = await query.order('created_at', { ascending: false });
      let allOrders = realOrders ? (realOrders as any[]) : [];

      // 2. Fetch Test Orders if Test Mode is ON
      if (isTestMode) {
          let testQuery = supabase.from('test_orders').select('*');
          
          if (user.role === 'customer') {
             testQuery = testQuery.eq('customer_id', user.id);
          }

          const { data: testData } = await testQuery.order('created_at', { ascending: false });
          
          if (testData) {
              const mappedTests = testData.map(t => ({ 
                  ...t, 
                  is_test: true,
                  restaurants: restaurants.find(r => r.id === t.restaurant_id) || { name: 'Test Restaurant' }
              }));
              allOrders = [...mappedTests, ...allOrders];
          }
      }

      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(allOrders);
  };

  useEffect(() => {
      if (user) refreshOrders();
  }, [user, restaurant, isTestMode, restaurants]);

  // --- Auth & Profile ---
  const updateProfile = async (name: string, phone: string) => {
      if (!user) return;
      const { error } = await supabase.from('profiles').update({ name, phone }).eq('id', user.id);
      if (error) throw new Error(error.message);
      setUser(prev => prev ? { ...prev, name, phone } : null);
  };

  const login = async (email: string, pass: string) => {
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
      setCart([]);
  };

  // --- Test User & Test Restaurant Login ---
  const enableTestUser = (code: string) => {
      if (code === '4321') {
          setIsTestUser(true);
          sessionStorage.setItem('isTestUser', 'true');
          return true;
      }
      return false;
  };

  const loginAsTestRestaurant = async (restaurantId: string) => {
      const testRest = TEST_RESTAURANTS.find(r => r.id === restaurantId);
      if (!testRest) return;

      // Create a mock profile for the test owner
      const mockOwnerProfile: Profile = {
          id: testRest.owner_id,
          name: 'Test Owner',
          role: 'restaurant_owner',
          phone: '0000000000',
          banned: false,
          created_at: new Date().toISOString()
      };

      setUser(mockOwnerProfile);
      setRestaurant(testRest);
      // Wait a tick for state to settle then fetch orders
      setTimeout(() => refreshOrders(), 100);
  };

  // --- Orders ---
  const placeOrder = async (restaurantId: string, items: CartItem[], total: number) => {
      try {
        let response;
        if (isTestMode) {
             response = await apiCreateTestOrder(restaurantId, items, total);
        } else {
             response = await apiCreateOrder(restaurantId, items, total);
        }

        if (response.ok && response.order) {
            const fullOrder = { 
                ...response.order,
                restaurants: restaurants.find(r => r.id === restaurantId)
            };
            setOrders(prev => [fullOrder, ...prev]);
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
          throw e;
      }
  };
  
  // --- Menu Management ---
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
      // If Test Restaurant, just mock add to state (backend won't accept unauthorized insert)
      if (restaurant?.id.startsWith('test-r')) {
          const mockItem = { ...item, id: `test-item-${Date.now()}`, created_at: new Date().toISOString() } as MenuItem;
          setMenu(prev => [...prev, mockItem]);
          return;
      }
      const newItem = await apiAddMenuItem(item);
      setMenu(prev => [...prev, newItem]);
  };

  const deleteMenuItem = async (id: string) => {
      if (restaurant?.id.startsWith('test-r')) {
           setMenu(prev => prev.filter(i => i.id !== id));
           return;
      }
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
        const { data: existing } = await supabase.from('restaurants').select('*').eq('name', CONFIG_REST_NAME).single();
        const newStatus = !isTestMode;

        if (!existing) {
            let ownerId = user?.id;
            if (user?.id === 'master-admin-bypass') {
                const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
                if (profiles && profiles.length > 0) ownerId = profiles[0].id;
            }

            const { error } = await supabase.from('restaurants').insert([{
                owner_id: ownerId,
                name: CONFIG_REST_NAME,
                payment_method: 'upi',
                verified: false,
                banned: newStatus 
            }]);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('restaurants').update({ banned: newStatus }).eq('id', existing.id);
            if (error) throw error;
        }

        setIsTestMode(newStatus);
        await refreshRestaurants(true);
    } catch (e: any) {
        console.error("Failed to toggle Test Mode:", e);
        alert("Failed to save Test Mode state.");
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
      user, restaurant, loading, login, signup, logout, updateProfile,
      restaurants, menu, orders,
      placeOrder, markOrderPaid, markOrderReady, completeOrder,
      addMenuItem, deleteMenuItem,
      deleteRestaurant, approveRestaurant, getRestaurantStats,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      notifications, ratings,
      isTestMode, toggleTestMode,
      isTestUser, enableTestUser, loginAsTestRestaurant
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