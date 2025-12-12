# Grab&Go 🍔🏃‍♂️

**Streamlined Campus Food Pre-ordering System**

Grab&Go is a modern web application designed to reduce wait times at campus cafeterias and restaurants. It enables students to pre-order meals, pay via UPI, and pick up their food using secure verification codes. For restaurant owners, it offers a powerful dashboard to manage orders, menus, and payments efficiently, featuring AI-powered menu digitization.

---

## 🚀 Key Features

### 🎓 For Students
*   **Browse & Order:** Explore campus restaurants, view detailed menus, and place orders instantly.
*   **Secure Payments:** Integrated UPI payment flow with encrypted transaction details.
*   **Live Tracking:** Real-time status updates (Accepted, Preparing, Ready, Completed).
*   **Secure Pickup:** Unique 4-digit PIN generation for order verification.
*   **PWA Support:** Installable on mobile devices for a native app-like experience.

### 🏪 For Restaurants
*   **Live Order Dashboard:** Real-time incoming order feeds with status indicators.
*   **Order Management:** Accept, decline, and update order status with a single click.
*   **AI Menu Creator:** Upload a photo of a physical menu, and our AI (powered by Google Gemini) automatically digitizes it into the system.
*   **Secure Verification:** Verify student pickup codes to ensure the right meal goes to the right person.
*   **Sales & Settings:** Manage payment details (Encrypted UPI ID) and upload cover images.

### 🛡️ For Admins
*   **Restaurant Verification:** Review and approve new restaurant sign-ups.
*   **Analytics:** View platform-wide revenue and order statistics.
*   **User Management:** Monitor and manage platform activity.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **Backend & Auth:** Supabase (PostgreSQL, Authentication, Realtime)
*   **Storage:** Supabase Storage
*   **AI Integration:** Google Gemini API (OCR & Menu Parsing)
*   **Security:** AES-GCM Encryption (Client-side sensitive data protection), SHA-256 Hashing.
*   **Icons:** Lucide React

---

## ⚙️ Configuration

To run this project, ensure the following services are configured:

1.  **Supabase Credentials:**
    *   Set up a project on Supabase.
    *   Configure Authentication (Email/Password).
    *   Create tables: `profiles`, `restaurants`, `menu_items`, `orders`, `test_orders`.

2.  **Storage (Supabase):**
    *   Create a public bucket named `restaurant-covers`.

3.  **Google Gemini API:**
    *   Obtain an API Key for AI features (Menu scanning).

---

## 🔒 Security

Grab&Go prioritizes user security. Sensitive payment information (like Restaurant UPI IDs) is encrypted using **AES-GCM** before storage and decrypted only on the client-side for authorized users. Critical administrative actions are protected via cryptographic hash verification.

---

## 📱 Mobile Experience

This application is optimized for mobile devices and includes a Web App Manifest, allowing users to add it to their home screens for a seamless, full-screen experience.
