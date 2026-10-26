# V2 Online Dress Store — Deployment & Operations Guide

## 1. Architecture Overview

The V2 Online Dress Store is a scalable, cloud-ready e-commerce and business operations platform built for long-term growth.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + `qrcode.react`
- **Database:** Supabase PostgreSQL with Row Level Security (RLS), atomic stored procedures, and immutable snapshots.
- **Order Flow:** WhatsApp assisted checkout with prefilled itemized specifications and manual payment tracking (UPI, GPay, Bank Transfer, COD, Cash).
- **Logistics:** Printable parcel shipping labels with secure unguessable QR tokens (`V2-SHIP:<token>`) and browser-compatible barcode/QR scanner.

---

## 2. Environment Variables Configuration

Create a `.env` file in the root directory:

```bash
# Production Supabase PostgreSQL & Auth Credentials
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# NOTE: Never put the service-role key in client frontend code!
```

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the application connects to your Supabase PostgreSQL backend. In local development or preview mode without cloud credentials, the application automatically uses its high-fidelity local database engine with 100% feature parity.

---

## 3. Database Migration & Setup

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Navigate to **SQL Editor**.
3. Open `supabase/migrations/20261026000000_v2_core_schema.sql`.
4. Execute the script to create:
   - Relational tables (`profiles`, `categories`, `products`, `product_images`, `inventory_movements`, `orders`, `order_items`, `order_status_history`, `payment_records`, `shipments`, `business_settings`, `audit_logs`).
   - Indexes on SKU, category, dates, phones, and status columns.
   - Row Level Security (RLS) policies ensuring customers only see active, in-stock products and their own orders.
   - Atomic stored procedures: `create_order_atomic`, `accept_order_atomic`, `cancel_order_atomic`, `ship_order_by_token_atomic`, and `record_payment_atomic`.
   - Initial boutique categories: **Nighty**, **Panties**, **Banians**, **Nightdress**, and **Inskirts (Pavadai)**.

---

## 4. Supabase Storage Setup for Product Images

1. In Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket**, name it `product-images`.
3. Set **Public Bucket** to `ON` (allowing fast thumbnail delivery through CDN).
4. Apply the following Storage Policy:
   - **SELECT (Read):** Public access enabled.
   - **INSERT / UPDATE / DELETE:** Restricted to administrators (`auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')`).

---

## 5. Phone OTP Authentication Configuration

The platform supports customer mobile authentication.

1. In Supabase Dashboard, navigate to **Authentication -> Providers -> Phone**.
2. Enable Phone authentication and select your preferred SMS Gateway provider:
   - **Twilio**
   - **MessageBird**
   - **Msg91** (highly recommended for India / INR cost efficiency)
3. Enter your Account SID, Auth Token, and Sender ID.
4. Set SMS template:
   ```
   Your V2 Boutique verification code is: {{ .Code }}
   ```
5. **Cost & Quota Note:** SMS OTP providers typically charge ₹0.15 to ₹0.25 per SMS in India. Set reasonable daily rate limits in Supabase Auth to prevent SMS abuse.

---

## 6. Administrator Account Setup

To designate a store administrator:
1. Register a user in the application or in Supabase Auth with the store admin's mobile number (e.g. `9876543210`).
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE phone = '9876543210';
   ```
3. Admins will immediately gain access to the protected **Admin Console**, product catalogue management, inventory adjustments, QR scanner, payment logs, and sales reports.

---

## 7. Backup & Disaster Recovery Strategy

1. **Daily Backups:** Supabase Pro plans provide automated daily backups with 7-day retention and Point-in-Time Recovery (PITR).
2. **Manual Schema & Data Dump:**
   Run periodically using the Supabase CLI:
   ```bash
   supabase db dump -f backup_$(date +%Y%m%d).sql
   ```
3. **Data Protection:** Customer addresses and payment transaction references are protected by RLS and cannot be read through public endpoints.

---

## 8. Scalability & Limitations

- **No Application Hardcoding:** There are no arbitrary caps on products, customers, categories, orders, or images.
- **Server-Side Pagination:** Data tables and storefront collections use server-style pagination with customizable limits (e.g. 12 or 15 items per page) to ensure low memory footprints.
- **Stock Integrity:** Available stock is strictly calculated as `Physical Stock - Reserved Stock`. Negative stock is disallowed by database check constraints.
- **Real Tracking Disclaimer:** The QR scanner confirms physical dispatch from the warehouse. Live GPS courier transit tracking requires integrating with courier APIs (e.g. Delhivery, Shiprocket, ST Courier).
