
export type UserRole = 'customer' | 'restaurant_owner' | 'admin';

export interface Profile {
  id: string; // auth.users.id
  name: string;
  phone?: string;
  role: UserRole;
  banned: boolean;
  created_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  email?: string;
  verified: boolean;
  banned: boolean;
  payment_method: 'upi' | 'razorpay';
  upi_id?: string;
  upi_qr_url?: string;
  razorpay_key_id?: string;
  created_at: string;
  // Local helper for UI (defaults provided if missing in DB)
  image?: string; 
  cuisine?: string; 
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  photo_url?: string;
  created_at?: string;
  // Category is not in SQL schema, handling as optional for UI
  category?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  items: any[]; // JSONB in DB
  total: number;
  status: OrderStatus;
  pickup_code: string;
  razorpay_order_id?: string;
  paid: boolean;
  created_at: string;
  updated_at: string;
  
  // Joins (fetched via select string)
  profiles?: { name: string; phone: string };
  restaurants?: { name: string };
  
  // Test Mode Flag
  is_test?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}

export interface Rating {
  id: string;
  restaurantId: string;
  userId: string;
  rating: number;
  comment: string;
  timestamp: number;
}
