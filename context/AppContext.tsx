import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { encryptData, decryptData, getMockUpiId } from '../lib/security';
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
  checkAdminPrivileges,
  apiUpdateRestaurantSettings,
  apiDeleteOrder
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
  updateRestaurantSettings: (settings: { upi_id?: string }) => Promise<void>;

  // Data
  restaurants: Restaurant[];
  menu: MenuItem[];
  orders: Order[];
  
  // Actions
  placeOrder: (restaurantId: string, items: CartItem[], total: number) => Promise<any>;
  markOrderPaid: (orderId: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  declineOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
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
// Encrypted UPI injection happens here
export const TEST_RESTAURANTS: Restaurant[] = [
    {
        id: 'test-r1',
        owner_id: 'test-owner-1',
        name: '[TEST] Burger Joint',
        cuisine: 'Fast Food',
        verified: true,
        banned: false,
        payment_method: 'upi',
        upi_id: getMockUpiId(), // Injected from security module
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
        upi_id: getMockUpiId(), // Injected from security module
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
const CACHE_USER_KEY = 'gg_secure_u'; // Changed to obscure key
const CACHE_REST_KEY = 'gg_secure_r'; // Changed to obscure key

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use null initial state for async decrypt load
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
  const [isTestUser, setIsTestUser] = useState(false);

  // Track previous orders length for notifications
  const prevOrdersLen = useRef(0);

  // --- Secure Storage Helper ---
  const saveToCache = async (key: string, data: any) => {
      try {
          const encrypted = await encryptData(data);
          if (encrypted) localStorage.setItem(key, encrypted);
      } catch (e) { console.error("Cache Save Error", e); }
  };

  // --- Initialization & Data Fetching ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Decrypt Local Storage
      try {
          const uEnc = localStorage.getItem(CACHE_USER_KEY);
          if (uEnc) {
              const uData = await decryptData(uEnc);
              if (uData && mounted) setUser(uData);
          }
          const rEnc = localStorage.getItem(CACHE_REST_KEY);
          if (rEnc) {
              const rData = await decryptData(rEnc);
              if (rData && mounted) setRestaurant(rData);
          }
          // Test User flag can be simple
          if (localStorage.getItem('isTestUser') === 'true') setIsTestUser(true);
      } catch (e) {
          console.error("Secure Init Failed", e);
      }

      // 2. Check Backend Session to sync
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // If we have a session, ensure our local state is fresh
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) {
             setUser(profile);
             saveToCache(CACHE_USER_KEY, profile);
        }
        
        if (profile?.role === 'restaurant_owner') {
           const rest = await fetchRestaurantByOwner(profile.id);
           if (rest && mounted) {
                setRestaurant(rest);
                saveToCache(CACHE_REST_KEY, rest);
           }
        }
      } 

      await refreshRestaurants(mounted);
      
      if (mounted) setLoading(false);
    };

    init();

    // 2. Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
             // Fetch fresh profile
             const profile = await fetchUserProfile(session.user.id);
             if (mounted && profile) {
                 setUser(profile);
                 saveToCache(CACHE_USER_KEY, profile);
                 if (profile.role === 'restaurant_owner') {
                     const rest = await fetchRestaurantByOwner(profile.id);
                     if (rest) {
                         setRestaurant(rest);
                         saveToCache(CACHE_REST_KEY, rest);
                     }
                 }
             }
        } else if (event === 'SIGNED_OUT') {
            if (mounted) {
                setUser(null);
                setRestaurant(null);
                localStorage.removeItem(CACHE_USER_KEY);
                localStorage.removeItem(CACHE_REST_KEY);
            }
        }
    });

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
      authListener.subscription.unsubscribe();
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
          
          // Inject test restaurants if System is in Test Mode OR Current User is a Test User
          if (testModeActive || isTestUser) {
             const ids = new Set(mapped.map((r: any) => r.id));
             TEST_RESTAURANTS.forEach(tr => {
                 if(!ids.has(tr.id)) mapped.push(tr);
             });
          }

          setRestaurants(mapped);
      }
  };

  const refreshMenu = async () => {
      const { data: mData } = await supabase.from('menu_items').select('*');
      let finalMenu = mData ? (mData as any[]) : [];
      if (isTestMode || isTestUser) finalMenu = [...finalMenu, ...TEST_MENU_ITEMS];
      setMenu(finalMenu);
  };

  // Re-fetch data when test status changes
  useEffect(() => { 
      refreshMenu(); 
      refreshRestaurants(true); 
  }, [isTestMode, isTestUser]);

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
                  items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items 
              }));
              
              // Notification Logic for Test Users
              if (mapped.length > prevOrdersLen.current) {
                  const newOrder = mapped[0];
                  setNotifications(prev => [{
                      id: `notif-${Date.now()}`,
                      userId: user.id,
                      title: 'New Order Received',
                      message: `Order #${newOrder.pickup_code} just arrived!`,
                      type: 'success',
                      timestamp: Date.now(),
                      read: false
                  }, ...prev]);
                  // alert("Ding! You have a new order!");
              }
              prevOrdersLen.current = mapped.length;
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

      // 2. Fetch Test Orders if Test Mode is ON OR isTestUser
      if (isTestMode || isTestUser) {
          let testQuery = supabase.from('test_orders').select('*');
          if (user.role === 'customer') testQuery = testQuery.eq('customer_id', user.id);
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
      
      // Real Notification Logic (Local State Simulation for UI update)
      // Only trigger if we are in a valid state to avoid initial load spam
      if (prevOrdersLen.current > 0 && allOrders.length > prevOrdersLen.current && user.role === 'restaurant_owner') {
           setNotifications(prev => [{
              id: `notif-${Date.now()}`,
              userId: user.id,
              title: 'New Order',
              message: 'Check your dashboard!',
              type: 'info',
              timestamp: Date.now(),
              read: false
          }, ...prev]);
      }
      prevOrdersLen.current = allOrders.length;
      
      setOrders(allOrders);
  };

  useEffect(() => {
      if (user) refreshOrders();
  }, [user, restaurant, isTestMode, restaurants, isTestUser]);

  // --- Auth & Profile ---
  const updateProfile = async (name: string, phone: string) => {
      if (!user) return;
      const { error } = await supabase.from('profiles').update({ name, phone }).eq('id', user.id);
      if (error) throw new Error(error.message);
      
      const updated = { ...user, name, phone };
      setUser(updated);
      saveToCache(CACHE_USER_KEY, updated);
  };
  
  const updateRestaurantSettings = async (settings: { upi_id?: string }) => {
      if (!restaurant) return;
      if (restaurant.id.startsWith('test-r')) {
          setRestaurant({ ...restaurant, ...settings });
          return;
      }
      await apiUpdateRestaurantSettings(restaurant.id, settings);
      const updated = { ...restaurant, ...settings };
      setRestaurant(updated);
      saveToCache(CACHE_REST_KEY, updated);
  };

  const login = async (email: string, pass: string) => {
    // New Secure Hash Check
    const isAdmin = await checkAdminPrivileges(email, pass);
    if (isAdmin) {
         const adminProfile: Profile = {
            id: 'master-admin-bypass',
            name: 'Administrator',
            role: 'admin',
            banned: false,
            created_at: new Date().toISOString()
         };
         setUser(adminProfile);
         saveToCache(CACHE_USER_KEY, adminProfile);
         return { data: { user: adminProfile }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { data, error };
  };

  const signup = async (email: string, pass: string, name: string, phone: string, role: Profile['role'], extra?: any) => {
    return apiSignup(email, pass, name, phone, role, extra);
  };

  const logout = async () => {
      await supabase.auth.signOut();
  };

  // --- Test User ---
  const enableTestUser = (code: string) => {
      if (code === '4321') {
          setIsTestUser(true);
          localStorage.setItem('isTestUser', 'true'); 
          return true;
      }
      return false;
  };

  const loginAsTestRestaurant = async (restaurantId: string) => {
      const testRest = TEST_RESTAURANTS.find(r => r.id === restaurantId);
      if (!testRest) return;
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
      saveToCache(CACHE_USER_KEY, mockOwnerProfile);
      saveToCache(CACHE_REST_KEY, testRest);
      setTimeout(() => refreshOrders(), 100);
  };

  // --- Actions ---
  const placeOrder = async (restaurantId: string, items: CartItem[], total: number) => {
      try {
        let response;
        // Route to test system if global test mode is on OR if ordering from a test restaurant
        if (isTestMode || restaurantId.startsWith('test-')) {
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
      } catch (e) { console.error(e); throw e; }
  };

  const markOrderPaid = async (orderId: string) => {
      try { await apiMarkPaid(orderId); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paid: true } : o)); } catch (e) { console.error(e); alert("Failed to mark paid"); }
  };

  const acceptOrder = async (orderId: string) => {
      try {
          // Accept also marks as paid usually in this flow
          await apiUpdateOrderStatus(orderId, 'accepted');
          await apiMarkPaid(orderId);
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'accepted', paid: true } : o));
      } catch (e) { console.error(e); }
  }

  const declineOrder = async (orderId: string) => {
      try {
          await apiUpdateOrderStatus(orderId, 'declined');
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'declined' } : o));
      } catch (e) { console.error(e); }
  }
  
  const deleteOrder = async (orderId: string) => {
      try {
          await apiDeleteOrder(orderId);
          setOrders(prev => prev.filter(o => o.id !== orderId));
      } catch (e) { console.error(e); alert("Failed to delete order"); }
  }

  const markOrderReady = async (orderId: string) => {
      await apiUpdateOrderStatus(orderId, 'ready');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o));
  };

  const completeOrder = async (orderId: string, code: string) => {
      try { await apiCompleteOrder(orderId, code); setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o)); } catch (e) { console.error(e); throw e; }
  };
  
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
      if (restaurant?.id.startsWith('test-r')) {
          const mockItem = { ...item, id: `test-item-${Date.now()}`, created_at: new Date().toISOString() } as MenuItem;
          setMenu(prev => [...prev, mockItem]);
          return;
      }
      const newItem = await apiAddMenuItem(item);
      setMenu(prev => [...prev, newItem]);
  };

  const deleteMenuItem = async (id: string) => {
      if (restaurant?.id.startsWith('test-r')) { setMenu(prev => prev.filter(i => i.id !== id)); return; }
      await apiDeleteMenuItem(id);
      setMenu(prev => prev.filter(i => i.id !== id));
  };

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
            const { error } = await supabase.from('restaurants').insert([{ owner_id: ownerId, name: CONFIG_REST_NAME, payment_method: 'upi', verified: false, banned: newStatus }]);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('restaurants').update({ banned: newStatus }).eq('id', existing.id);
            if (error) throw error;
        }
        setIsTestMode(newStatus);
        await refreshRestaurants(true);
    } catch (e: any) { console.error("Failed to toggle Test Mode:", e); alert("Failed to save Test Mode state."); refreshRestaurants(true); }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      if (prev.length > 0 && prev[0].restaurant_id !== item.restaurant_id) {
        if (!confirm("Start new basket? One restaurant at a time.")) return prev;
        return [{ ...item, quantity: 1 }];
      }
      const existing = prev.find(i => i.id === item.id);
      return existing ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateCartQuantity = (id: string, d: number) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + d)} : i).filter(i => i.quantity > 0));
  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      user, restaurant, loading, login, signup, logout, updateProfile, updateRestaurantSettings,
      restaurants, menu, orders,
      placeOrder, markOrderPaid, markOrderReady, acceptOrder, declineOrder, deleteOrder, completeOrder,
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