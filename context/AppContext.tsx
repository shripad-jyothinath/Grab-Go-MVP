import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, MenuItem, Order, UserRole, CartItem, Restaurant, AppNotification, Rating } from '../types';

interface AppContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (username: string, phoneNumber: string, password: string, role: UserRole, extraData?: any) => Promise<{ success: boolean; message?: string }>;
  checkPhoneAvailable: (phone: string) => boolean;
  sendVerificationOTP: (phone: string) => Promise<string>;
  logout: () => void;
  restaurants: Restaurant[];
  updateRestaurantImage: (url: string) => void;
  deleteRestaurant: (id: string) => void;
  approveRestaurant: (id: string) => void;
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
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  ratings: Rating[];
  addRating: (restaurantId: string, rating: number, comment: string) => void;
  getRestaurantStats: (restaurantId: string) => { averageRating: number; reviewCount: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Campus Grill', cuisine: 'Burgers & American', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80', isApproved: true },
  { id: 'r2', name: 'Green Leaf', cuisine: 'Healthy & Vegan', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', isApproved: true },
  { id: 'r3', name: 'Bean There', cuisine: 'Coffee & Pastries', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80', isApproved: true },
];

const INITIAL_MENU: MenuItem[] = [
  { id: '1', restaurantId: 'r1', name: 'Campus Burger', description: 'Classic beef patty with cheddar.', price: 8.50, category: 'Mains' },
  { id: '3', restaurantId: 'r1', name: 'Sweet Potato Fries', description: 'Served with spicy mayo.', price: 4.50, category: 'Sides' },
  { id: '2', restaurantId: 'r2', name: 'Veggie Wrap', description: 'Grilled vegetables with hummus.', price: 7.00, category: 'Mains' },
  { id: '4', restaurantId: 'r3', name: 'Iced Matcha', description: 'Organic matcha with oat milk.', price: 5.00, category: 'Drinks' },
];

// Mock Users for existing restaurants so they can login. Default password '1234'
// Added mock phone numbers
const INITIAL_USERS = [
  { username: 'Campus Grill', phoneNumber: '5550000001', password: 'password', role: 'restaurant', relatedId: 'r1' },
  { username: 'Green Leaf', phoneNumber: '5550000002', password: 'password', role: 'restaurant', relatedId: 'r2' },
  { username: 'Bean There', phoneNumber: '5550000003', password: 'password', role: 'restaurant', relatedId: 'r3' },
  { username: 'Student', phoneNumber: '5550000004', password: 'password', role: 'student', relatedId: 's1' },
];

const INITIAL_RATINGS: Rating[] = [
  { id: 'rat1', restaurantId: 'r1', userId: 's1', userName: 'Student', rating: 4, comment: 'Great burgers!', timestamp: Date.now() },
  { id: 'rat2', restaurantId: 'r1', userId: 's99', userName: 'Jane', rating: 5, comment: 'Amazing!', timestamp: Date.now() },
  { id: 'rat3', restaurantId: 'r2', userId: 's1', userName: 'Student', rating: 5, comment: 'Super fresh.', timestamp: Date.now() }
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

  const [ratings, setRatings] = useState<Rating[]>(() => {
      const saved = localStorage.getItem('cc_ratings');
      return saved ? JSON.parse(saved) : INITIAL_RATINGS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('cc_restaurants', JSON.stringify(restaurants)); }, [restaurants]);
  useEffect(() => { localStorage.setItem('cc_menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('cc_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('cc_users', JSON.stringify(registeredUsers)); }, [registeredUsers]);
  useEffect(() => { localStorage.setItem('cc_ratings', JSON.stringify(ratings)); }, [ratings]);


  // --- Order Watcher (30 min warning) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      orders.forEach(order => {
        if (order.status === 'ready' && order.readyTimestamp) {
          const elapsed = now - order.readyTimestamp;
          // 30 minutes in ms = 30 * 60 * 1000 = 1800000
          
          // Warning at 25 mins
          if (elapsed > 1500000 && elapsed < 1560000) { // Approx 25 mins
             addNotification(order.studentName, `Warning: Order #${order.displayId} will be cancelled in 5 mins without refund!`, 'warning');
          }
          
          // Warning at 30 mins (Cancel threshold)
          if (elapsed > 1800000) {
             // In a real app we might auto-cancel here
             // updateOrderStatus(order.id, 'cancelled');
             // But for now, just aggressive alerting
             addNotification(order.studentName, `URGENT: Order #${order.displayId} is past 30 mins pickup window!`, 'error');
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [orders]);

  const addNotification = (targetUserName: string, message: string, type: AppNotification['type']) => {
    // Find user ID for target name (simplified logic)
    const targetUser = registeredUsers.find(u => u.username === targetUserName);
    const userId = targetUser ? (targetUser.relatedId || 'unknown') : 'unknown';

    const newNote: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title: 'Order Update',
      message,
      type,
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [newNote, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // --- Auth Actions ---
  const checkPhoneAvailable = (phone: string): boolean => {
    return !registeredUsers.some(u => u.phoneNumber === phone);
  };

  const sendVerificationOTP = async (phone: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Generate 4 digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    return code;
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Admin Override
    if (identifier === 'Admin' && password === 'hasini20') {
      setUser({ id: 'admin', name: 'Administrator', role: 'admin' });
      return { success: true };
    }

    // Search by username OR phone number
    const foundUser = registeredUsers.find(u => 
      u.username.toLowerCase() === identifier.toLowerCase() || 
      u.phoneNumber === identifier
    );
    
    if (!foundUser) {
      return { success: false, message: 'User not found.' };
    }

    if (foundUser.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    // Check Approval for Restaurants
    if (foundUser.role === 'restaurant') {
       const restaurant = restaurants.find(r => r.id === foundUser.relatedId);
       if (restaurant && !restaurant.isApproved) {
         return { success: false, message: 'Account pending approval. Please contact Admin on WhatsApp.' };
       }
    }

    setUser({
      id: foundUser.relatedId || Date.now().toString(),
      name: foundUser.username,
      phoneNumber: foundUser.phoneNumber,
      role: foundUser.role as UserRole,
      restaurantId: foundUser.role === 'restaurant' ? foundUser.relatedId : undefined
    });

    return { success: true };
  };

  const signup = async (username: string, phoneNumber: string, password: string, role: UserRole, extraData?: any): Promise<{ success: boolean; message?: string }> => {
    // Double check unique constraint
    if (registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Username already taken.' };
    }
    if (registeredUsers.some(u => u.phoneNumber === phoneNumber)) {
      return { success: false, message: 'Phone number already registered.' };
    }

    let relatedId = Math.random().toString(36).substr(2, 9);

    if (role === 'restaurant') {
      const newRestaurant: Restaurant = {
        id: relatedId,
        name: username,
        cuisine: extraData?.cuisine || 'General',
        image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
        isApproved: false // Default to unapproved
      };
      setRestaurants(prev => [...prev, newRestaurant]);
    }

    const newUser = { username, phoneNumber, password, role, relatedId };
    setRegisteredUsers(prev => [...prev, newUser]);

    // Do NOT auto login for restaurants now, as they need approval
    if (role === 'restaurant') {
        return { success: true, message: 'PENDING_APPROVAL' }; 
    }

    setUser({
      id: relatedId,
      name: username,
      phoneNumber: phoneNumber,
      role: role,
      restaurantId: undefined
    });

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setNotifications([]);
  };

  // --- Restaurant Management ---
  const deleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    setMenuState(prev => prev.filter(m => m.restaurantId !== id));
  };

  const approveRestaurant = (id: string) => {
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
  };

  const updateRestaurantImage = (url: string) => {
    if (user?.role === 'restaurant' && user.restaurantId) {
        setRestaurants(prev => prev.map(r => r.id === user.restaurantId ? { ...r, image: url } : r));
    }
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
      displayId: Math.floor(10000 + Math.random() * 90000).toString(),
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
    
    // Notify Restaurant (simulated by adding to their notification stack if we had one, but restaurant dashboard polls orders anyway)
    // We can add a notification for the student
    addNotification(user.name, `Order #${newOrder.displayId} placed successfully.`, 'info');
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updates: Partial<Order> = { status };
        
        // Notify Student
        let message = `Order #${o.displayId} status: ${status}`;
        let type: AppNotification['type'] = 'info';

        if (status === 'accepted') {
             message = `Good news! Order #${o.displayId} has been accepted.`;
             type = 'success';
        } else if (status === 'ready') {
             updates.readyTimestamp = Date.now(); // Mark ready time
             message = `Order #${o.displayId} is READY! Pickup now.`;
             type = 'success';
        } else if (status === 'declined') {
            message = `Order #${o.displayId} was declined. Refund initiated.`;
            type = 'error';
        }

        // We trigger the notification here. 
        // Note: In a real app this would go to the specific user via backend. 
        // Here we just add to the global notification state which filters by user in the UI.
        addNotification(o.studentName, message, type);

        return { ...o, ...updates };
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

  // --- Rating Actions ---
  const addRating = (restaurantId: string, rating: number, comment: string) => {
     if (!user) return;
     const newRating: Rating = {
         id: Math.random().toString(36).substr(2, 9),
         restaurantId,
         userId: user.id,
         userName: user.name,
         rating,
         comment,
         timestamp: Date.now()
     };
     setRatings(prev => [newRating, ...prev]);
     addNotification(user.name, 'Thanks for your review!', 'success');
  };

  const getRestaurantStats = (restaurantId: string) => {
     const rRatings = ratings.filter(r => r.restaurantId === restaurantId);
     const count = rRatings.length;
     const averageRating = count > 0 
        ? rRatings.reduce((acc, curr) => acc + curr.rating, 0) / count 
        : 0;
     return { averageRating, reviewCount: count };
  };

  return (
    <AppContext.Provider value={{
      user, login, signup, logout, checkPhoneAvailable, sendVerificationOTP,
      restaurants, deleteRestaurant, approveRestaurant, updateRestaurantImage,
      menu, addMenuItem, setMenu, deleteMenuItem,
      orders, placeOrder, updateOrderStatus, verifyOrderPickup,
      cart, addToCart, removeFromCart, clearCart, updateCartQuantity,
      notifications, markNotificationRead,
      ratings, addRating, getRestaurantStats
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