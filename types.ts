export type UserRole = 'student' | 'restaurant' | null;

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  image: string;
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

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'ready' | 'completed';

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
  pickupTime?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  restaurantId?: string; // If role is restaurant
}