# Security Specification for ZY GADGET STORE

## 1. Data Invariants
- **Products (`/products/{productId}`)**:
  - Anyone (public/unauthenticated and authenticated customers) can read products.
  - Only authorized store admins (bootstrapped owner `zenetofficialhub@gmail.com` or documents in `/admins/{uid}`) can create, update, or delete products.
  - Required fields on create: `name`, `brand`, `category`, `price`, `stock`, `condition`, `status`.
  - Non-admins CANNOT modify prices, stock, or status.
  - Strings must have bounded lengths (e.g. `name.size() <= 200`, `price >= 0`).

- **Categories (`/categories/{categoryId}`)**:
  - Public read access for navigation and catalog filtering.
  - Only authorized store admins can create, update, or delete categories.

- **Orders & Inquiries (`/orders/{orderId}`)**:
  - Any customer (guest or authenticated) can create an order inquiry with valid data: `customerName`, `customerPhone`, `totalAmount`, `status == 'pending'`, `contactMethod`.
  - Customers can read only their own orders (`resource.data.userId == request.auth.uid`), while store admins can read all orders.
  - Only store admins can update order statuses or delete orders. Ordinary customers cannot update orders after submission.

- **Store Settings (`/settings/{settingId}`)**:
  - Public read access so customers see verified store contact (phone, WhatsApp, hours, announcement).
  - Only store admins can modify store settings.

- **Admins (`/admins/{adminId}`)**:
  - Only store admins can read/write to the admin list.
  - Non-admins cannot self-promote.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

1. **Payload 1: Unauthenticated Product Injection**
   - Attempt by anonymous user to create a product document in `/products`.
   - Expected: `PERMISSION_DENIED`.

2. **Payload 2: Customer Price Modification**
   - Authenticated non-admin customer sends update to `/products/phone1` with `price: 0.01`.
   - Expected: `PERMISSION_DENIED`.

3. **Payload 3: Product Ghost Field Injection (Shadow Update)**
   - Malicious admin or user injects shadow field `maliciousPayload: "<script>..."`.
   - Expected: `PERMISSION_DENIED` due to schema key boundary checks.

4. **Payload 4: Category Deletion by Customer**
   - Authenticated non-admin calls `deleteDoc(doc(db, 'categories', 'smartphones'))`.
   - Expected: `PERMISSION_DENIED`.

5. **Payload 5: Customer Reading Other Customers' Orders**
   - Customer A (`uid: user_abc`) calls `getDoc(doc(db, 'orders', 'order_xyz'))` where `order_xyz.userId == "user_def"`.
   - Expected: `PERMISSION_DENIED`.

6. **Payload 6: Customer Query Scraping All Orders**
   - Customer A queries `collection(db, 'orders')` without `where('userId', '==', 'user_abc')`.
   - Expected: `PERMISSION_DENIED`.

7. **Payload 7: Order Status Escalation by Customer**
   - Customer submits update to their order with `status: 'completed'`.
   - Expected: `PERMISSION_DENIED` (only admins can change status).

8. **Payload 8: Self-Promotion to Admin**
   - Non-admin user creates `/admins/{request.auth.uid}` with `{ role: 'owner' }`.
   - Expected: `PERMISSION_DENIED`.

9. **Payload 9: Settings Tampering**
   - Non-admin attempts to replace store's WhatsApp number in `/settings/store`.
   - Expected: `PERMISSION_DENIED`.

10. **Payload 10: Negative Price Injection**
    - Malicious payload with `price: -500`.
    - Expected: `PERMISSION_DENIED`.

11. **Payload 11: Oversized Denial-of-Wallet Payload**
    - Injection of a 2MB string in product description or ID poisoning.
    - Expected: `PERMISSION_DENIED`.

12. **Payload 12: Email Spoofing without Verification**
    - Unverified token claiming to be admin email with `email_verified == false`.
    - Expected: `PERMISSION_DENIED`.
