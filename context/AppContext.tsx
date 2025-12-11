import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, MenuItem, Order, UserRole, CartItem, Restaurant } from '../types';

interface AppContextType {
  user: User | null;
  login: (name: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, password: string, role: UserRole, extraData?: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  restaurants: Restaurant[];
  deleteRestaurant: (id: string) => void;
  menu: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  setMenu: (items: MenuItem[]) => void;
  orders: Order[];
  placeOrder: (restaurantId: string, items: CartItem[], total: number, pickupTime: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  verifyOrderPickup: (orderId: string, code: string) => boolean;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Campus Grill', cuisine: 'Burgers & American', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80' },
  { id: 'r2', name: 'Green Leaf', cuisine: 'Healthy & Vegan', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' },
  { id: 'r3', name: 'Bean There', cuisine: 'Coffee & Pastries', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' },
];

const INITIAL_MENU: MenuItem[] = [
  { id: '1', restaurantId: 'r1', name: 'Campus Burger', description: 'Classic beef patty with cheddar.', price: 8.50, category: 'Mains' },
  { id: '3', restaurantId: 'r1', name: 'Sweet Potato Fries', description: 'Served with spicy mayo.', price: 4.50, category: 'Sides' },
  { id: '2', restaurantId: 'r2', name: 'Veggie Wrap', description: 'Grilled vegetables with hummus.', price: 7.00, category: 'Mains' },
  { id: '4', restaurantId: 'r3', name: 'Iced Matcha', description: 'Organic matcha with oat milk.', price: 5.00, category: 'Drinks' },
];

// Mock Users for existing restaurants so they can login. Default password '1234'
const INITIAL_USERS = [
  { username: 'Campus Grill', password: 'password', role: 'restaurant', relatedId: 'r1' },
  { username: 'Green Leaf', password: 'password', role: 'restaurant', relatedId: 'r2' },
  { username: 'Bean There', password: 'password', role: 'restaurant', relatedId: 'r3' },
  { username: 'Student', password: 'password', role: 'student', relatedId: 's1' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  
  // Persisted Data
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const saved = localStorage.getItem('cc_restaurants');
    return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
  });

  const [menu, setMenuState] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('cc_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cc_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth Store (Simulated Database)
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('cc_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('cc_restaurants', JSON.stringify(restaurants)); }, [restaurants]);
  useEffect(() => { localStorage.setItem('cc_menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('cc_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('cc_users', JSON.stringify(registeredUsers)); }, [registeredUsers]);

  // --- Auth Actions ---
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Admin Check (Hardcoded)
    if (username === 'Admin' && password === 'hasini20') {
      setUser({ id: 'admin', name: 'Administrator', role: 'admin' });
      return { success: true };
    }

    // Database Check
    const foundUser = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!foundUser) {
      return { success: false, message: 'User not found.' };
    }

    if (foundUser.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    // Set User Session
    setUser({
      id: foundUser.relatedId || Date.now().toString(),
      name: foundUser.username,
      role: foundUser.role as UserRole,
      restaurantId: foundUser.role === 'restaurant' ? foundUser.relatedId : undefined
    });

    return { success: true };
  };

  const signup = async (username: string, password: string, role: UserRole, extraData?: any): Promise<{ success: boolean; message?: string }> => {
    if (registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Username already taken.' };
    }

    let relatedId = Math.random().toString(36).substr(2, 9);

    // If Restaurant, create restaurant profile
    if (role === 'restaurant') {
      const newRestaurant: Restaurant = {
        id: relatedId,
        name: username,
        cuisine: extraData?.cuisine || 'General',
        image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80' // Default image
      };
      setRestaurants(prev => [...prev, newRestaurant]);
    }

    // Save User
    const newUser = { username, password, role, relatedId };
    setRegisteredUsers(prev => [...prev, newUser]);

    // Auto Login
    setUser({
      id: relatedId,
      name: username,
      role: role,
      restaurantId: role === 'restaurant' ? relatedId : undefined
    });

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    // Also remove items and orders? For prototype, keeping it simple.
    setMenuState(prev => prev.filter(m => m.restaurantId !== id));
  };

  // --- Menu Actions ---
  const addMenuItem = (item: MenuItem) => {
    setMenuState(prev => [...prev, item]);
  };

  const setMenu = (items: MenuItem[]) => {
    setMenuState(items);
  };

  const deleteMenuItem = (id: string) => {
    setMenuState(prev => prev.filter(i => i.id !== id));
  }

  // --- Order Actions ---
  const placeOrder = (restaurantId: string, items: CartItem[], total: number, pickupTime: string) => {
    if (!user) return;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      displayId: Math.floor(10000 + Math.random() * 90000).toString(), // 5-digit ID
      restaurantId,
      studentName: user.name,
      items,
      totalAmount: total,
      status: 'pending',
      timestamp: Date.now(),
      pickupTime
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status };
      }
      return o;
    }));
  };

  const verifyOrderPickup = (orderId: string, code: string): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status === 'ready' && order.displayId === code) {
      updateOrderStatus(orderId, 'completed');
      return true;
    }
    return false;
  };

  // --- Cart Actions ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        if (!window.confirm("Start a new basket? You can only order from one restaurant at a time.")) {
           return prev;
        }
        return [{ ...item, quantity: 1 }];
      }
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      user, login, signup, logout,
      restaurants, deleteRestaurant,
      menu, addMenuItem, setMenu, deleteMenuItem,
      orders, placeOrder, updateOrderStatus, verifyOrderPickup,
      cart, addToCart, removeFromCart, clearCart, updateCartQuantity
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};