import { supabase } from '../lib/supabase';
import { CartItem, Order } from '../types';

const FUNCTION_URL_BASE = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL}/functions/v1`
  : 'http://localhost:54321/functions/v1'; // Local fallback

// --- Edge Function Wrappers ---

export const apiCreateOrder = async (restaurantId: string, items: CartItem[], total: number) => {
  // If we don't have a real Supabase connection, simulate success for UI testing
  if (process.env.SUPABASE_URL === undefined) {
      console.warn("Simulating Create Order (No Supabase URL)");
      return {
          ok: true,
          order: {
              id: Math.random().toString(36).substr(2, 9),
              restaurant_id: restaurantId,
              items,
              total,
              status: 'pending',
              pickup_code: Math.floor(1000 + Math.random() * 9000).toString(),
              paid: false,
              created_at: new Date().toISOString()
          }
      };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${FUNCTION_URL_BASE}/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ restaurant_id: restaurantId, items })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create order: ${errorText}`);
  }

  return await response.json();
};

export const apiMarkPaid = async (orderId: string, merchantReference?: string) => {
   if (process.env.SUPABASE_URL === undefined) {
      console.warn("Simulating Mark Paid");
      return { ok: true };
   }

   const { data: { session } } = await supabase.auth.getSession();
   if (!session) throw new Error("Not authenticated");

   const response = await fetch(`${FUNCTION_URL_BASE}/restaurant-mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ order_id: orderId, merchant_reference: merchantReference })
  });

  if (!response.ok) throw new Error("Failed to mark paid");
  return await response.json();
};

export const apiCompleteOrder = async (orderId: string, code: string) => {
    if (process.env.SUPABASE_URL === undefined) {
        console.warn("Simulating Complete Order");
        return { ok: true }; // Always succeed in simulation
     }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await fetch(`${FUNCTION_URL_BASE}/complete-order`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ order_id: orderId, code })
    });

    if (!response.ok) throw new Error("Failed to complete order. Invalid code?");
    return await response.json();
};

// --- Database Helpers ---

export const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data;
};

export const fetchRestaurantByOwner = async (ownerId: string) => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('owner_id', ownerId).single();
    if (error) return null;
    return data;
};
