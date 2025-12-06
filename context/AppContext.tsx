import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, MenuItem, Order, UserRole, CartItem, Restaurant } from '../types';

interface AppContextType {
  user: User | null;
  login: (name: string, role: UserRole) => boolean; // Returns success
  logout: () => void;
  restaurants: Restaurant[];
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

// Mock Restaurants
const MOCK_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Campus Grill', cuisine: 'Burgers & American', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80' },
  { id: 'r2', name: 'Green Leaf', cuisine: 'Healthy & Vegan', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' },
  { id: 'r3', name: 'Bean There', cuisine: 'Coffee & Pastries', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' },
];

// Mock initial data
const INITIAL_MENU: MenuItem[] = [
  { id: '1', restaurantId: 'r1', name: 'Campus Burger', description: 'Classic beef patty with cheddar.', price: 8.50, category: 'Mains' },
  { id: '3', restaurantId: 'r1', name: 'Sweet Potato Fries', description: 'Served with spicy mayo.', price: 4.50, category: 'Sides' },
  { id: '2', restaurantId: 'r2', name: 'Veggie Wrap', description: 'Grilled vegetables with hummus.', price: 7.00, category: 'Mains' },
  { id: '4', restaurantId: 'r3', name: 'Iced Matcha', description: 'Organic matcha with oat milk.', price: 5.00, category: 'Drinks' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenuState] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('cc_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cc_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('cc_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('cc_orders', JSON.stringify(orders));
  }, [orders]);

  // --- Auth Actions ---
  const login = (name: string, role: UserRole): boolean => {
    if (role === 'restaurant') {
      // Find matching restaurant by name (case insensitive)
      const restaurant = MOCK_RESTAURANTS.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (!restaurant) {
        return false;
      }
      setUser({ id: restaurant.id, name: restaurant.name, role, restaurantId: restaurant.id });
      return true;
    } else {
      setUser({ id: Date.now().toString(), name, role });
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  // --- Menu Actions ---
  const addMenuItem = (item: MenuItem) => {
    setMenuState(prev => [...prev, item]);
  };

  const setMenu = (items: MenuItem[]) => {
    // When bulk setting, we merge or replace. 
    // For simplicity in this demo, if a restaurant updates via AI, we might only want to replace *their* items.
    // However, the dashboard logic handles filtering. Here we just set state.
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
      // Check if cart has items from another restaurant
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
      user, login, logout,
      restaurants: MOCK_RESTAURANTS,
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