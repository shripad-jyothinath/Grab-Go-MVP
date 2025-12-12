import { supabase } from '../lib/supabase';
import { CartItem, MenuItem, Profile } from '../types';

// --- Direct DB Interactions (MVP Mode) ---

// --- Admin Credential Security ---
// Obfuscated hashes to prevent casual discovery. 
// _H1 = Email (admin@grabandgo.com)
// _H2 = Password (hasini20)
const _H1 = "YWRtaW5AZ3JhYmFuZGdvLmNvbQ=="; 
const _H2 = "aGFzaW5pMjA="; 

export const checkAdminPrivileges = (email: string, pass: string) => {
    try {
        const e = btoa(email.toLowerCase());
        const p = btoa(pass);
        return e === _H1 && p === _H2;
    } catch {
        return false;
    }
}

export const apiSignup = async (email: string, pass: string, name: string, phone: string, role: Profile['role'], extra?: any) => {
    let finalRole = role;
    
    // Use the secure check
    if (checkAdminPrivileges(email, pass)) {
        finalRole = 'admin';
    }

    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password: pass,
        options: {
            data: {
                full_name: name,
                phone: phone,
                role: finalRole // Store role in metadata for redundancy
            }
        }
    });

    if (error) return { error };
    
    if (data.user) {
        // Create Profile in public table
        const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            name,
            phone,
            role: finalRole
        }]);
        
        if (profileError) {
             console.error("Profile creation failed", profileError);
             return { error: profileError };
        }

        // If Restaurant, create Restaurant row
        if (finalRole === 'restaurant_owner') {
             const { error: restError } = await supabase.from('restaurants').insert([{
                 owner_id: data.user.id,
                 name: extra?.restaurantName || 'My Restaurant',
                 payment_method: 'upi', 
                 verified: false // Restaurants require admin approval
             }]);
             if (restError) return { error: restError };
        }
    }
    return { data, error: null };
};

export const apiCreateOrder = async (restaurantId: string, items: CartItem[], total: number) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  // Generate a random 4-digit code client-side for MVP
  const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        customer_id: session.user.id,
        restaurant_id: restaurantId,
        items: items, // stored as JSONB
        total: total,
        status: 'pending',
        pickup_code: pickupCode,
        paid: false
      }
    ])
    .select('*, restaurants(*)') // Return order with restaurant details
    .single();

  if (error) {
    console.error("Create Order Error:", error);
    throw new Error(error.message);
  }

  return { ok: true, order: data };
};

export const apiMarkPaid = async (orderId: string, merchantReference?: string) => {
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) throw new Error("Not authenticated");

   const { error } = await supabase
     .from('orders')
     .update({ paid: true })
     .eq('id', orderId);

  if (error) throw new Error("Failed to mark paid");
  return { ok: true };
};

export const apiCompleteOrder = async (orderId: string, code: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Fetch order to verify code
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('pickup_code, status')
        .eq('id', orderId)
        .single();
    
    if (fetchError || !order) throw new Error("Order not found");

    if (order.pickup_code !== code) {
        throw new Error("Invalid Pickup Code");
    }

    const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

    if (error) throw new Error(error.message);
    return { ok: true };
};

export const apiUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
    if (error) throw new Error(error.message);
};

// --- Menu Management ---

export const apiAddMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const payload = {
        restaurant_id: item.restaurant_id,
        name: item.name,
        description: item.description,
        price: item.price,
        photo_url: item.photo_url
    };

    const { data, error } = await supabase
        .from('menu_items')
        .insert([payload])
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    return { ...data, category: item.category };
};

export const apiDeleteMenuItem = async (id: string) => {
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
};

// --- Database Fetch Helpers ---

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