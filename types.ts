export type UserRole = 'student' | 'restaurant' | 'admin' | null;

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  image: string;
  isApproved: boolean; // New field for approval status
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'ready' | 'completed' | 'cancelled';

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  displayId: string;
  restaurantId: string;
  studentName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: number;
  readyTimestamp?: number; // Track when order became ready
  pickupTime?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  restaurantId?: string; // If role is restaurant
}

export interface AppNotification {
  id: string;
  userId: string; // Who is this for?
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}