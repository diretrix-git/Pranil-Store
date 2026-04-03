# MarketHub — Multi-Vendor E-Commerce Platform

A full-stack multi-vendor marketplace built with the **MERN stack** (MongoDB Atlas, Express, React/Vite, Node.js). Multiple sellers each manage their own store; buyers browse products, manage a cart, place orders, and print invoices. A superadmin oversees the entire platform.

---

## Tech Stack

| Layer      | Technology                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| Frontend   | React 18 + Vite, React Router v7, TanStack Query, Zustand, Framer Motion, Tailwind CSS v4 |
| Backend    | Node.js, Express 4, Mongoose                                                              |
| Database   | MongoDB Atlas                                                                             |
| Images     | Cloudinary                                                                                |
| Auth       | JWT in httpOnly cookies                                                                   |
| Monitoring | Sentry, Winston                                                                           |

---

## Project Structure

```
markethub/
├── client/                  # React/Vite frontend
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Route pages (buyer / seller / admin)
│   │   └── App.jsx
│   └── .env.example
│
└── server/                  # Express backend
    ├── config/              # DB + Cloudinary config
    ├── controllers/         # Route handlers
    ├── middleware/          # Auth, rate limiter, validator, error handler
    ├── models/              # Mongoose schemas
    ├── routes/              # Express routers
    ├── utils/               # Logger, AppError, Cloudinary helpers
    ├── validators/          # express-validator chains
    ├── seed.js              # Database seed script
    └── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### 1. Clone the repo

```bash
git clone https://github.com/your-username/markethub.git
cd markethub
```

### 2. Configure environment variables

**Server:**

```bash
cd server
cp .env.example .env
# Edit .env with your values
```

**Client:**

```bash
cd client
cp .env.example .env
# Edit .env with your values
```

### 3. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 4. Seed the database

```bash
cd server
node seed.js
```

This creates all categories, a superadmin, a demo seller with a store, a demo buyer, and 3 sample products — all in MongoDB Atlas.

To wipe and re-seed:

```bash
node seed.js --fresh
```

### 5. Run the app

```bash
# Terminal 1 — Backend
cd server && node server.js

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api/v1

---

## Default Accounts (after seeding)

| Role       | Email                | Password    |
| ---------- | -------------------- | ----------- |
| Superadmin | admin@markethub.com  | Admin@1234  |
| Seller     | seller@markethub.com | Seller@1234 |
| Buyer      | buyer@markethub.com  | Buyer@1234  |

> **Note:** Superadmin accounts can only be created via the seed script, not through the registration form.

---

## User Roles

| Role           | Capabilities                                                    |
| -------------- | --------------------------------------------------------------- |
| **Buyer**      | Browse products, manage cart, place orders, view/print invoices |
| **Seller**     | Manage own store, products, suppliers, and incoming orders      |
| **Superadmin** | View all users, stores, orders; activate/deactivate accounts    |

---

## API Overview

All routes are prefixed with `/api/v1`.

| Resource   | Endpoints                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Auth       | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                               |
| Categories | `GET /categories`                                                                                            |
| Products   | `GET /products`, `GET /products/:id`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`          |
| Cart       | `GET /cart`, `POST /cart/add`, `PATCH /cart/item/:id`, `DELETE /cart/item/:id`, `DELETE /cart/clear`         |
| Orders     | `POST /orders`, `GET /orders/my`, `GET /orders/store`, `PATCH /orders/:id/status`, `GET /orders/:id/invoice` |
| Suppliers  | `GET /suppliers`, `POST /suppliers`, `PUT /suppliers/:id`, `DELETE /suppliers/:id`                           |
| Stores     | `GET /stores/me`, `PUT /stores/me`, `GET /stores`, `PATCH /stores/:id/status`                                |
| Admin      | `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/stats`                                      |

---

## Data Storage

| Data                                               | Where                                                                 |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| Users, stores, products, orders, carts, categories | MongoDB Atlas (`pranilStore` database)                                |
| Product images, store logos                        | Cloudinary (`/stores/{storeId}/products/`, `/stores/{storeId}/logo/`) |

---

## Security

- JWT stored in **httpOnly, Secure, SameSite=Strict** cookies — never in localStorage
- Passwords hashed with **bcrypt** (salt rounds: 12)
- **helmet**, **express-mongo-sanitize**, **hpp** middleware applied globally
- Strict **CORS** — only allows the configured `CLIENT_URL`
- Rate limiting per route group (disabled in development)
- Sellers can only access their own store's data — enforced on every request

---

## Category System (N:M)

Products and categories have a **many-to-many** relationship:

- One product can belong to multiple categories
- One category can contain many products
- Categories are stored in MongoDB and fetched dynamically in the UI

---

## Environment Variables

### Server (`server/.env`)

| Variable                | Description                                |
| ----------------------- | ------------------------------------------ |
| `PORT`                  | Server port (default: 5000)                |
| `NODE_ENV`              | `development` or `production`              |
| `MONGO_URI`             | MongoDB Atlas connection string            |
| `JWT_SECRET`            | Secret key (min 32 chars)                  |
| `JWT_EXPIRES_IN`        | Token expiry (e.g. `7d`)                   |
| `CLIENT_URL`            | Frontend URL for CORS                      |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                      |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                         |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                      |
| `SENTRY_DSN`            | Sentry DSN for error monitoring (optional) |

### Client (`client/.env`)

| Variable       | Description          |
| -------------- | -------------------- |
| `VITE_API_URL` | Backend API base URL |

---

## Deployment

| Service  | Platform      |
| -------- | ------------- |
| Backend  | Railway       |
| Frontend | Vercel        |
| Database | MongoDB Atlas |
| Images   | Cloudinary    |

Connect your GitHub repo to Railway (backend) and Vercel (frontend) for auto-deploy on push. Set all environment variables in each platform's dashboard.
