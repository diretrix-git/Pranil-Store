# Pranil Store

Pranil Store is a B2B marketplace where buyers browse products from multiple vendors, maintain a cart, place and track orders, and print invoices. Administrators manage the catalog, vendors, buyers, orders, and contact messages.

## Implemented features

- Buyer and admin roles. Buyers sign in through Clerk components; an admin role is assigned through Clerk public metadata and synchronized to MongoDB.
- Product catalog with search and category, vendor, and price filters.
- Admin management for products, categories, vendors, buyer accounts, orders, and contact messages.
- Persistent carts, stock checks and deduction during checkout, order status management, and print-ready invoices.
- Cloudinary image uploads for admin-managed product images.
- Admin dashboard metrics and authenticated Socket.IO notifications for new orders and contact messages.
- Optional Upstash Redis caching for catalog data.
- Order and status emails sent through Gmail SMTP using Nodemailer. Sending is asynchronous and fire-and-forget; it is not backed by a durable queue.

Vendors are catalog records managed by admins. There is no seller account or seller dashboard. Checkout records orders and stock; payment processing is not implemented.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, Zustand, Tailwind CSS, Framer Motion |
| Backend | Node.js 20+, Express 4, TypeScript, Mongoose |
| Authentication | Clerk sign-in/sign-up components and session tokens |
| Data | MongoDB; optional Upstash Redis over REST for caching |
| Media and email | Cloudinary; Nodemailer with Gmail SMTP |
| Realtime and monitoring | Socket.IO; Winston; optional Sentry |

## Deployment

The repository includes a [Render Blueprint](render.yaml) for a Node web service and a static frontend. The frontend has an SPA rewrite for client-side routes. The Blueprint installs backend dependencies and starts the tracked `server/dist/server.js` output. If backend TypeScript source changes, compile it and review the resulting `server/dist` changes before deployment. The repository's `server/package.json` also defines a build script, but the current Blueprint does not call it.

To deploy your own instance, connect the repository to Render and configure the backend environment variables listed below in the service dashboard. Set `CLIENT_URL` to the frontend origin(s), separated by commas, and set the static site's `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` build environment variables. The committed `client/.env.production` also supplies an API URL and Clerk publishable key for production frontend builds; replace these for your own deployment. Vite embeds `VITE_*` values in the public client bundle.

`nginx.conf` is present for a possible manually managed VPS setup; the Render Blueprint does not use it. The project contains a Vercel SPA rewrite file, but the documented deployment is Render.

## Local development

### Requirements

- Node.js 20 or newer and npm
- A MongoDB database
- A Clerk application (publishable and secret keys)
- Cloudinary credentials for product image uploads
- Optional: Upstash Redis REST credentials for caching
- Optional: Gmail SMTP app credentials for email notifications

### Setup

```bash
git clone https://github.com/diretrix-git/Pranil-Store.git
cd Pranil-Store

cp server/.env.example server/.env
cp client/.env.example client/.env
```

The `cp` commands also work in PowerShell as aliases for `Copy-Item`. Fill in the local environment files before starting the services. `MONGO_URI`, `CLERK_SECRET_KEY`, and `CLERK_PUBLISHABLE_KEY` are required by the backend at startup. `CLIENT_URL` should include the frontend origin, normally `http://localhost:5173`.

Install each app's dependencies and start the development servers in separate terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:5000/api/v1`.

### Environment variables

The committed examples are `server/.env.example` and `client/.env.example`.

| Variable | App | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Server | MongoDB connection string (required) |
| `CLERK_SECRET_KEY` | Server | Verifies Clerk sessions (required) |
| `CLERK_PUBLISHABLE_KEY` | Server | Clerk application key required by backend startup |
| `CLIENT_URL` | Server | Comma-separated allowed frontend origins for CORS |
| `PORT`, `NODE_ENV` | Server | Port (defaults to `5000`) and runtime environment |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server | Cloudinary image uploads |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Server | Optional catalog caching; caching is skipped if unset or unavailable |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_FROM_NAME` | Server | Gmail SMTP email delivery |
| `ADMIN_EMAIL` | Server | New-order email recipient and admin seed account address |
| `ADMIN_PASSWORD`, `ADMIN_NAME` | Server | Explicit admin credentials used by optional seed and migration scripts |
| `SEED_BUYER_EMAIL`, `SEED_BUYER_PASSWORD` | Server | Explicit demo buyer credentials required by `npm run seed` |
| `SENTRY_DSN` | Server | Optional Sentry reporting |
| `VITE_API_URL` | Client | API base URL, including `/api/v1` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | Clerk frontend application key |

Never put server secrets in client variables: Vite exposes `VITE_*` values in the browser bundle. Local `.env` files are ignored by Git. The publishable Clerk key is designed to be public; the Clerk secret key, database credentials, Cloudinary API secret, and Gmail app password are not.

### Admin access

Sign in through Clerk, then assign the user `{"role":"admin"}` in that Clerk application's **public metadata**. On an authenticated API request, the server synchronizes the Clerk user and role to MongoDB. Use the same Clerk application and environment for the frontend and backend.

The server also provides seed scripts (`npm run seed`, `npm run seed:fresh`, and `npm run seed:admin`). Set the required credentials in `server/.env` before running them; the scripts do not provide password defaults. The full seed requires `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_BUYER_EMAIL`, and `SEED_BUYER_PASSWORD`. `seed:admin` also requires `ADMIN_NAME`. Review `server/seed.ts` and `server/scripts/seedAdmin.ts` before use. `seed:fresh` clears data; only run it against a database you intend to reset. The migration scripts are one-time administrative tools and require their own environment values.

## API

All application API routes are prefixed by `/api/v1`.

| Resource | Route prefix | Purpose |
| --- | --- | --- |
| Authentication sync | `/auth` | Get the signed-in user's MongoDB profile |
| Categories | `/categories` | Read and administer categories |
| Vendors | `/vendors` | Read and administer vendor records |
| Products | `/products` | Browse and administer products |
| Cart | `/cart` | Manage the signed-in buyer's cart |
| Orders | `/orders` | Place orders, view orders, update status, retrieve invoices |
| Contact | `/contact` | Submit and administer contact messages |
| Admin | `/admin` | Buyer management and dashboard statistics |

## Validation

The frontend defines `npm run lint` and `npm run build`. The backend defines `npm run build`. There is no implemented automated test suite; the backend `npm test` script is a placeholder that exits with an error.
