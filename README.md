# MarketHub — B2B Multi-Vendor Marketplace

A production-ready full-stack B2B marketplace built with the **MERN stack** + TypeScript. Admins manage products, vendors, categories, orders and buyers. Buyers browse, cart, and order. Real-time notifications, email queues, Redis caching, and rate limiting included.

---

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Frontend       | React 18 + Vite, TypeScript, React Router v7, TanStack Query, Zustand, Framer Motion, Tailwind CSS v4 |
| Backend        | Node.js, Express 4, TypeScript, Mongoose                                   |
| Database       | MongoDB Atlas                                                              |
| Auth           | Clerk (hosted sign-in/sign-up, session tokens)                             |
| Cache          | Upstash Redis (products, categories, vendors)                              |
| Email Queue    | BullMQ + Upstash Redis                                                     |
| Email Delivery | Nodemailer (Gmail)                                                         |
| File Storage   | Cloudinary                                                                 |
| Monitoring     | Sentry, Winston                                                            |

---

## Project Structure

```
markethub/
├── client/                     # React/Vite frontend (TypeScript)
│   ├── src/
│   │   ├── api/                # Axios instance (auto-attaches Clerk token)
│   │   ├── components/         # Navbar, ProtectedRoute, ProductCard, etc.
│   │   ├── context/            # AuthContext (Clerk → MongoDB sync)
│   │   ├── hooks/              # useAdminNotifications
│   │   ├── layouts/            # AdminLayout (persistent sidebar)
│   │   ├── pages/
│   │   │   ├── admin/          # Dashboard, Products, Categories, Vendors, Orders, Users, Messages
│   │   │   └── buyer/          # Home, Product, Cart, Orders, Invoice
│   │   ├── store/              # Zustand notification store
│   │   ├── types/              # Shared TypeScript interfaces
│   │   └── utils/              # formatCurrency, socket
│   ├── .env.example
│   └── tsconfig.json
│
├── server/                     # Express backend (TypeScript)
│   ├── config/                 # DB, Cloudinary, Redis (Upstash)
│   ├── controllers/            # Route handlers with caching
│   ├── middleware/             # Clerk auth, rate limiter, error handler
│   ├── models/                 # Mongoose schemas (User, Product, Order, Cart, Vendor, Category, Contact)
│   ├── queues/                 # BullMQ email queue + worker
│   ├── routes/                 # Express routers
│   ├── scripts/                # DB migration scripts
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Logger, AppError, Cloudinary helpers, Mailer
│   ├── validators/             # express-validator chains
│   ├── seed.ts                 # Full database seed (categories + admin + buyer + products)
│   └── .env.example
│
└── nginx.conf                  # Nginx reverse proxy config (for VPS deployment)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Clerk account (https://clerk.com)
- Upstash Redis account (https://upstash.com)

### 1. Clone

```bash
git clone https://github.com/your-username/markethub.git
cd markethub
```

### 2. Server environment

```bash
cd server
cp .env.example .env
```

Fill in `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Gmail (Nodemailer — requires 2FA App Password)
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_FROM_NAME=MarketHub

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Admin seed
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=StrongPass@123
ADMIN_NAME=Admin
```

### 3. Client environment

```bash
cd client
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 4. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 5. Seed the database

```bash
cd server
npm run seed
```

Creates: 6 categories, 1 admin, 1 demo buyer, 3 sample products.

To wipe and re-seed: `npm run seed:fresh`

### 6. Set admin role in Clerk

After seeding, go to your **Clerk Dashboard → Users → [admin user] → Edit → Public Metadata** and set:

```json
{ "role": "admin" }
```

### 7. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/v1

---

## Roles

| Role      | Capabilities                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| **Buyer** | Browse products, manage cart, place orders, view invoices                    |
| **Admin** | Manage products, categories, vendors, orders, users, messages; view stats    |

Admin accounts are created via Clerk Dashboard (set `publicMetadata.role = "admin"`).

---

## API Overview

All routes prefixed with `/api/v1`.

| Resource   | Key Endpoints                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Auth       | `GET /auth/me`                                                                                    |
| Categories | `GET /categories`, `POST /categories`, `DELETE /categories/:id`                                   |
| Vendors    | `GET /vendors`, `GET /vendors/all`, `POST /vendors`, `PUT /vendors/:id`, `DELETE /vendors/:id`    |
| Products   | `GET /products`, `GET /products/:id`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` |
| Cart       | `GET /cart`, `POST /cart/add`, `PATCH /cart/item/:id`, `DELETE /cart/item/:id`, `DELETE /cart/clear` |
| Orders     | `POST /orders`, `GET /orders/my`, `GET /orders`, `PATCH /orders/:id/status`, `GET /orders/:id/invoice` |
| Contact    | `POST /contact`, `GET /contact`, `PATCH /contact/:id/read`                                        |
| Admin      | `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/stats`                           |

---

## Infrastructure

| Feature          | Implementation                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| Rate Limiting    | `express-rate-limit` — auth: 10/15min, orders: 5/min, uploads: 20/10min, global: 200/min |
| DB Indexing      | Mongoose indexes on all query-heavy fields (categories, vendor, buyer+createdAt, isActive/isDeleted) |
| Caching          | Upstash Redis — categories (1hr), vendors (10min), products (2min), single product (5min) |
| Message Queue    | BullMQ — all emails queued with 3 retries + exponential backoff                |
| Load Balancing   | Nginx `upstream` block (see `nginx.conf`) — `least_conn` strategy              |
| Reverse Proxy    | Nginx — SSL termination, static file serving, WebSocket proxying               |
| CAP Theorem      | MongoDB Atlas = CP (Consistency + Partition Tolerance) — correct for B2B order data |

---

## Email Notifications

Buyers receive emails for:
- Order placed (pending)
- Order confirmed
- Order completed
- Order cancelled

Emails are sent via BullMQ queue (non-blocking, retries on failure).

---

## Deployment on Render

### Backend (Web Service)

| Setting       | Value                  |
| ------------- | ---------------------- |
| Root Dir      | `server`               |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start`            |
| Node Version  | 20                     |

Add all `server/.env` variables in Render's **Environment** tab.

### Frontend (Static Site)

| Setting       | Value           |
| ------------- | --------------- |
| Root Dir      | `client`        |
| Build Command | `npm install && npm run build` |
| Publish Dir   | `dist`          |

Add `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in Render's environment.

---

## VPS Deployment (with Nginx)

See `nginx.conf` at the project root. It handles:
- HTTP → HTTPS redirect
- SSL termination (use Certbot)
- Static file serving for the React build
- API proxying to Node.js
- WebSocket (Socket.io) proxying
- Load balancing across multiple Node instances

```bash
# Install Nginx
sudo apt install nginx

# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/markethub
sudo ln -s /etc/nginx/sites-available/markethub /etc/nginx/sites-enabled/

# Get SSL cert
sudo certbot --nginx -d yourdomain.com

# Reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Environment Variables Reference

### Server

| Variable                  | Description                              |
| ------------------------- | ---------------------------------------- |
| `PORT`                    | Server port (default: 5000)              |
| `NODE_ENV`                | `development` or `production`            |
| `MONGO_URI`               | MongoDB Atlas connection string          |
| `CLIENT_URL`              | Frontend URL for CORS                    |
| `CLERK_PUBLISHABLE_KEY`   | Clerk publishable key                    |
| `CLERK_SECRET_KEY`        | Clerk secret key                         |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                    |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                       |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                    |
| `GMAIL_USER`              | Gmail address for sending emails         |
| `GMAIL_APP_PASSWORD`      | Gmail App Password (16 chars)            |
| `GMAIL_FROM_NAME`         | Sender display name                      |
| `UPSTASH_REDIS_REST_URL`  | Upstash Redis REST URL                   |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Redis REST token                 |
| `ADMIN_EMAIL`             | Admin email for seed script              |
| `ADMIN_PASSWORD`          | Admin password for seed script           |
| `ADMIN_NAME`              | Admin display name for seed script       |
| `SENTRY_DSN`              | Sentry DSN (optional)                    |

### Client

| Variable                      | Description                    |
| ----------------------------- | ------------------------------ |
| `VITE_API_URL`                | Backend API base URL           |
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk publishable key          |
