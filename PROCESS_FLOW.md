# 📦 Okasina Fashion Store - Order Process Flow

This document explains what happens when a customer places an order and how you (the admin) should handle it.

## 1. Customer Journey

1.  **Browsing**: Customer views products on the Home or Shop page.
2.  **Cart**: Customer adds items to the cart.
3.  **Checkout**:
    *   Customer enters shipping details.
    *   Selects Shipping Method: **Postage (Rs 100)** or **Door Delivery (Rs 150)**.
    *   Clicks "Place Order".
4.  **Confirmation**:
    *   Order is saved to the database (`orders` table).
    *   Customer sees a success message.
    *   **NEW**: Customer can go to the **Orders** page (`/orders`) and search by their email to see their order status.

## 2. Admin Process (Your Role)

You should check the Admin Panel daily to manage new orders.

### Step 1: View New Orders
1.  Go to **[Admin Orders Page](https://okasinatrading.com/admin/orders)** (or `/admin/orders`).
2.  You will see a list of all orders.
3.  New orders will have the status **"Pending"**.

### Step 2: Process the Order
1.  Click on an order to see details (items, shipping address, phone number).
2.  **Contact the Customer**: Call or WhatsApp them to confirm the order and payment method (e.g., Juice, Bank Transfer, or Cash on Delivery).
3.  **Update Status**:
    *   Change status to **"Processing"** when you are packing the order.
    *   Change status to **"Shipped"** when you have sent it (via Post or Delivery Guy).
    *   Change status to **"Completed"** when the customer receives it.

### Step 3: Stock Management
*   Currently, stock is **not** automatically deducted (we can add this later).
*   You should manually ensure you have the items in stock.

## 3. Troubleshooting

### "I don't see the order in Admin Panel"
*   **Cause**: Database permissions (RLS) might be blocking you.
*   **Fix**: Run the SQL script `004_fix_rls_policies.sql` in Supabase.

### "Customer says they can't see their order"
*   **Cause**: They might have typed the wrong email.
*   **Fix**: Ask them to check the email they used. You can search for their name in the Admin Panel to find the correct email.

## 4. Next Steps for You
1.  **Run the SQL Script**: `004_fix_rls_policies.sql` (I have created this for you).
2.  **Redeploy**: I am pushing the changes now.
3.  **Test**: Place a test order and try to find it in the Admin Panel.
