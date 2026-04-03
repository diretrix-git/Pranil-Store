# Requirements Document

## Introduction

A full-stack multi-vendor e-commerce platform built on the MERN stack (MongoDB, Express, React/Vite, Node.js). The platform supports three user roles — superadmin, seller, and buyer — each with distinct capabilities. Sellers register and receive an auto-created store; buyers browse products, manage a persistent cart, place orders, and print invoices. A superadmin oversees the entire platform. Security, data integrity, and long-term maintainability are first-class concerns.

## Glossary

- **System**: The multi-vendor e-commerce platform as a whole.
- **API**: The Express/Node.js backend REST API, prefixed at `/api/v1`.
- **Client**: The React/Vite single-page application served to the browser.
- **Buyer**: An authenticated user with role `buyer` who browses and purchases products.
- **Seller**: An authenticated user with role `seller` who manages a single store.
- **Superadmin**: An authenticated user with role `superadmin` who manages the entire platform.
- **Store**: A seller-owned shop entity containing products, suppliers, and orders.
- **Product**: A purchasable item belonging to a single store.
- **Supplier**: A vendor that supplies products to a store, managed by the store's seller.
- **Cart**: A persistent, database-backed collection of items a buyer intends to purchase.
- **Order**: A completed purchase record containing immutable snapshots of buyer, store, and product data.
- **Invoice**: A print-ready document generated from an order's snapshot data.
- **JWT**: JSON Web Token used for stateless authentication.
- **Soft_Delete**: Marking a record as deleted via `isDeleted: true` without removing it from the database.
- **Snapshot**: A copy of data (buyer info, store info, product prices) embedded in an order at placement time.
- **Cloudinary**: The third-party image hosting service used for all media storage.
- **Auth_Middleware**: Server middleware that verifies the JWT cookie and attaches `req.user`.
- **RequireStore_Middleware**: Server middleware that verifies `req.user.store` exists and attaches `req.storeId`.
- **Validator**: The express-validator layer that checks and sanitizes all incoming request bodies.
- **Rate_Limiter**: The express-rate-limit middleware applied per route group.
- **Logger**: The Winston-based server-side logging utility.
- **Error_Handler**: The global Express error-handling middleware registered last.
- **AuthContext**: The React context that holds the authenticated user's state on the client.
- **AxiosInstance**: The single configured Axios instance used by all client API calls.
- **ProtectedRoute**: A React Router wrapper component that enforces role-based access to pages.

## Requirements

### Requirement 1: User Registration and Role Assignment

**User Story:** As a visitor, I want to register an account as either a buyer or seller, so that I can access role-appropriate features of the platform.

#### Acceptance Criteria

1. WHEN a visitor submits a registration form with valid name (2–50 chars), email, phone, password (min 8 chars with at least one letter and one number), and role (buyer or seller), THE API SHALL create a new User record and return a success response.
2. WHEN a visitor submits a registration request with role set to `superadmin`, THE API SHALL reject the request with HTTP 422 and an error message indicating the role is not permitted.
3. WHEN a visitor registers with role `seller`, THE API SHALL automatically create a new Store record linked to that user and set the user's `store` field to the new store's ID.
4. WHEN a registration request contains an email that already exists in the database, THE API SHALL return HTTP 409 with a descriptive error message.
5. THE Validator SHALL sanitize all registration string inputs using `.trim()` and `.escape()` before processing.
6. IF a registration request body exceeds 10kb, THEN THE API SHALL reject it with HTTP 413.
7. THE API SHALL hash the user's password using bcrypt with salt round 12 before persisting it to the database.
8. THE API SHALL never return the password field in any user query response.

### Requirement 2: Authentication and Session Management

**User Story:** As a registered user, I want to log in and stay authenticated securely, so that I can access protected features without re-entering credentials on every request.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE API SHALL issue a JWT with 7-day expiry stored in an httpOnly, Secure, SameSite=Strict cookie.
2. THE API SHALL never return the JWT in the response body or set it in a non-httpOnly cookie.
3. WHEN a user logs out, THE API SHALL immediately expire the auth cookie by setting its `maxAge` to 1ms.
4. THE Auth_Middleware SHALL verify the JWT from the cookie, fetch the user from the database, confirm `isActive: true` and `isDeleted: false`, and attach the user to `req.user` before passing to the next handler.
5. WHEN the JWT is expired or invalid, THE Auth_Middleware SHALL return HTTP 401 with a descriptive error message.
6. WHEN an authenticated user's account has `isActive: false`, THE Auth_Middleware SHALL return HTTP 403 with a descriptive error message.
7. THE API SHALL store the JWT secret exclusively in environment variables and the secret SHALL be at least 32 characters long.
8. WHEN a client calls `GET /api/v1/auth/me` with a valid cookie, THE API SHALL return the authenticated user's profile excluding the password field.

### Requirement 3: Role-Based Access Control

**User Story:** As a platform operator, I want each user role to access only its permitted resources, so that sellers cannot see other stores' data and buyers cannot perform seller actions.

#### Acceptance Criteria

1. THE API SHALL expose a `restrictTo(...roles)` middleware that returns HTTP 403 when the authenticated user's role is not in the permitted list.
2. WHEN a seller makes any data operation (read, create, update, delete) on a resource, THE API SHALL verify that the resource's `store` field matches `req.storeId` and return HTTP 403 if it does not.
3. THE RequireStore_Middleware SHALL verify that `req.user.store` is populated and attach `req.storeId` to the request; IF the seller has no associated store, THEN THE API SHALL return HTTP 403.
4. WHEN a buyer attempts to access a seller-only route, THE API SHALL return HTTP 403.
5. WHEN a non-superadmin attempts to access an admin-only route, THE API SHALL return HTTP 403.

### Requirement 4: Rate Limiting

**User Story:** As a platform operator, I want API rate limits enforced per route group, so that the platform is protected against brute-force and abuse.

#### Acceptance Criteria

1. WHEN a client exceeds 10 requests to auth routes within a 15-minute window from the same IP, THE Rate_Limiter SHALL return HTTP 429 with `{ "status": "error", "message": "Too many requests. Please try again later." }`.
2. WHEN a client exceeds 100 requests to general API routes within a 15-minute window from the same IP, THE Rate_Limiter SHALL return HTTP 429 with the standard error body.
3. WHEN a client exceeds 20 requests to the order placement route within a 15-minute window from the same IP, THE Rate_Limiter SHALL return HTTP 429 with the standard error body.
4. WHEN a client exceeds 10 requests to image upload routes within a 15-minute window from the same IP, THE Rate_Limiter SHALL return HTTP 429 with the standard error body.

### Requirement 5: Security Hardening

**User Story:** As a platform operator, I want standard security middleware applied globally, so that the API is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE API SHALL apply `helmet()` with default settings to all routes.
2. THE API SHALL apply `express-mongo-sanitize` to strip `$` and `.` characters from all request bodies before they reach controllers.
3. THE API SHALL apply `hpp` middleware to prevent HTTP parameter pollution.
4. THE API SHALL reject any request body larger than 10kb with HTTP 413.
5. THE API SHALL configure CORS with `origin` set to the exact value of the `CLIENT_URL` environment variable, `credentials: true`, explicit methods `["GET", "POST", "PUT", "PATCH", "DELETE"]`, and explicit `allowedHeaders: ["Content-Type", "Authorization"]`.
6. THE API SHALL never use `origin: "*"` in CORS configuration.
7. THE Error_Handler SHALL never expose stack traces in production responses.
8. THE Error_Handler SHALL be registered as the last middleware in the Express application.

### Requirement 6: Data Models and Soft Deletes

**User Story:** As a platform operator, I want all data to be soft-deleted rather than hard-deleted, so that historical records are preserved for auditing and invoice accuracy.

#### Acceptance Criteria

1. THE System SHALL add `isDeleted: { type: Boolean, default: false }` and `deletedAt: { type: Date, default: null }` fields to every MongoDB model (User, Store, Supplier, Product, Cart, Order).
2. WHEN any query is executed against a model, THE System SHALL filter by `isDeleted: false` by default unless explicitly overridden.
3. WHEN a delete operation is requested, THE System SHALL set `isDeleted: true` and `deletedAt` to the current timestamp instead of removing the document.
4. THE System SHALL define MongoDB indexes on the following fields: User — `email`; Store — `slug`; Supplier — `store`; Product — `{ store, isActive, isDeleted }` and `{ category }`; Cart — `buyer`; Order — `{ buyer, createdAt }`, `{ store, createdAt }`, `{ orderNumber }`.
5. THE Store model SHALL auto-generate a URL-safe `slug` from the store name in a pre-save hook.
6. THE Product model SHALL auto-generate a URL-safe `slug` from the product name in a pre-save hook.
7. THE Order model SHALL auto-generate an `orderNumber` in the format `ORD-YYYYMMDD-XXXX` in a pre-save hook.

### Requirement 7: Product Management

**User Story:** As a seller, I want to create, read, update, and delete products in my store, so that buyers can discover and purchase my inventory.

#### Acceptance Criteria

1. WHEN an authenticated seller submits a valid product creation request, THE API SHALL create a Product record associated with the seller's store and return HTTP 201.
2. WHEN a seller attempts to create a product with a `store` value that does not match `req.storeId`, THE API SHALL return HTTP 403.
3. WHEN a seller updates or deletes a product, THE API SHALL verify the product's `store` field matches `req.storeId` before applying the change; IF it does not match, THEN THE API SHALL return HTTP 403.
4. WHEN a seller deletes a product, THE API SHALL perform a Soft_Delete and also delete the product's images from Cloudinary.
5. THE Validator SHALL require product name (2–100 chars), price (numeric, min 0), stock (integer, min 0), and category (non-empty) for creation requests.
6. WHEN a public client calls `GET /api/v1/products`, THE API SHALL return all products where `isActive: true` and `isDeleted: false` across all stores, supporting search by name and filter by category.
7. WHEN a public client calls `GET /api/v1/products/:id`, THE API SHALL return the product if `isActive: true` and `isDeleted: false`; IF not found, THEN THE API SHALL return HTTP 404.

### Requirement 8: Supplier Management

**User Story:** As a seller, I want to manage my store's suppliers, so that I can track where my products come from.

#### Acceptance Criteria

1. WHEN an authenticated seller submits a valid supplier creation request, THE API SHALL create a Supplier record linked to the seller's store and return HTTP 201.
2. WHEN a seller reads, updates, or deletes a supplier, THE API SHALL verify the supplier's `store` field matches `req.storeId`; IF it does not match, THEN THE API SHALL return HTTP 403.
3. WHEN a seller deletes a supplier, THE API SHALL perform a Soft_Delete.
4. WHEN a seller lists suppliers, THE API SHALL return only suppliers where `store` matches `req.storeId` and `isDeleted: false`.

### Requirement 9: Persistent Cart

**User Story:** As a buyer, I want my cart to be saved to the database, so that my items persist across sessions and devices.

#### Acceptance Criteria

1. THE System SHALL store each buyer's cart as a single Cart document in MongoDB, keyed by the buyer's user ID.
2. WHEN a buyer adds a product to the cart from a store different from the store of existing cart items, THE API SHALL return HTTP 409 with a message indicating the cart can only contain items from one store at a time.
3. WHEN a buyer fetches the cart, THE API SHALL re-validate each item's current price from the Product collection and update the price snapshot in the cart if the price has changed.
4. THE Cart model SHALL auto-calculate `totalAmount` in a pre-save hook by summing `price × quantity` for all items.
5. WHEN a buyer removes all items or clears the cart, THE API SHALL update the Cart document to reflect an empty items array and zero `totalAmount`.
6. WHEN a buyer updates the quantity of a cart item to zero or less, THE API SHALL remove that item from the cart.

### Requirement 10: Order Placement and Snapshots

**User Story:** As a buyer, I want to place an order from my cart, so that I can purchase products and receive an accurate invoice even if product details change later.

#### Acceptance Criteria

1. WHEN a buyer places an order, THE API SHALL validate that every cart item has sufficient stock before creating the Order document; IF any item is out of stock, THEN THE API SHALL return HTTP 409 with a descriptive error.
2. WHEN an order is created, THE API SHALL copy the buyer's name, phone, email, and address into `buyerSnapshot` on the Order document.
3. WHEN an order is created, THE API SHALL copy the store's name, phone, email, address, logo, and `invoiceNote` into `storeSnapshot` on the Order document.
4. WHEN an order is created, THE API SHALL copy each product's name, price, quantity, unit, and subtotal into the Order's `items` array.
5. WHEN an order is successfully created, THE API SHALL atomically deduct the purchased quantity from each product's `stock` field and clear the buyer's Cart document.
6. THE Order document SHALL never use live references to buyer or store data for invoice generation; all invoice data SHALL be read exclusively from the snapshot fields.
7. WHEN an order is created, THE API SHALL set the initial `status` to `pending` and `paymentStatus` to `unpaid`.

### Requirement 11: Order Management

**User Story:** As a seller, I want to view and update the status of orders placed in my store, so that I can fulfill them efficiently.

#### Acceptance Criteria

1. WHEN a seller calls `GET /api/v1/orders/store`, THE API SHALL return only orders where `store` matches `req.storeId` and `isDeleted: false`.
2. WHEN a seller updates an order's status, THE API SHALL verify the order's `store` field matches `req.storeId`; IF it does not match, THEN THE API SHALL return HTTP 403.
3. THE API SHALL only allow order status transitions to valid enum values: `pending`, `confirmed`, `processing`, `completed`, `cancelled`.
4. WHEN a buyer calls `GET /api/v1/orders/my`, THE API SHALL return only orders where `buyer` matches the authenticated user's ID and `isDeleted: false`.
5. WHEN a superadmin calls `GET /api/v1/orders`, THE API SHALL return all orders across all stores where `isDeleted: false`.

### Requirement 12: Invoice Generation

**User Story:** As a buyer, I want to view and print a formatted invoice for any of my orders, so that I have a permanent record of my purchase.

#### Acceptance Criteria

1. WHEN an authenticated buyer, seller (own store), or superadmin calls `GET /api/v1/orders/:orderId/invoice`, THE API SHALL return the full order document including all snapshot fields.
2. WHEN a buyer requests an invoice for an order that does not belong to them, THE API SHALL return HTTP 403.
3. WHEN a seller requests an invoice for an order that does not belong to their store, THE API SHALL return HTTP 403.
4. THE Invoice page SHALL render exclusively from snapshot data (buyerSnapshot, storeSnapshot, items array) and SHALL NOT make additional API calls to fetch live product or store data.
5. THE Invoice page SHALL auto-trigger `window.print()` after a 500ms delay once the order data has loaded.
6. THE Invoice page SHALL use `@media print` CSS to hide all navigation, buttons, and non-invoice elements during printing.
7. THE Invoice page SHALL display: store header (logo, name, address, phone, email), invoice/order number, order date, buyer info (name, buyer ID, phone, address), itemized product table (name, unit, quantity, unit price, subtotal), discount row (if `discountAmount > 0`), tax row (if `taxAmount > 0`), grand total, order notes, and the store's `invoiceNote` as a footer.

### Requirement 13: Image Uploads

**User Story:** As a seller, I want to upload product images and a store logo, so that my store looks professional to buyers.

#### Acceptance Criteria

1. WHEN a seller uploads an image, THE API SHALL accept only `image/jpeg`, `image/png`, and `image/webp` MIME types; IF another type is submitted, THEN THE API SHALL return HTTP 422.
2. WHEN a seller uploads an image, THE API SHALL reject files larger than 5MB with HTTP 413.
3. THE API SHALL store product images in Cloudinary under the path `/stores/{storeId}/products/` and store logos under `/stores/{storeId}/logo/`.
4. THE API SHALL store only the Cloudinary URL string in the MongoDB document, not binary data.
5. WHEN a product or store logo is soft-deleted, THE API SHALL also delete the associated image(s) from Cloudinary.

### Requirement 14: Store Management

**User Story:** As a seller, I want to manage my store's settings, so that buyers see accurate store information and invoices display the correct details.

#### Acceptance Criteria

1. WHEN an authenticated seller calls `GET /api/v1/stores/me`, THE API SHALL return the store document associated with `req.storeId`.
2. WHEN an authenticated seller calls `PUT /api/v1/stores/me` with valid data, THE API SHALL update only the store associated with `req.storeId`.
3. THE API SHALL allow sellers to update store name, logo, address, phone, email, and `invoiceNote`.
4. WHEN a superadmin calls `GET /api/v1/stores`, THE API SHALL return all stores where `isDeleted: false`.
5. WHEN a superadmin calls `PATCH /api/v1/stores/:id/status`, THE API SHALL toggle the store's `isActive` field and return the updated store document.

### Requirement 15: Superadmin Platform Management

**User Story:** As a superadmin, I want to view and manage all users and stores on the platform, so that I can maintain platform health and enforce policies.

#### Acceptance Criteria

1. WHEN a superadmin calls `GET /api/v1/admin/users`, THE API SHALL return all users where `isDeleted: false`.
2. WHEN a superadmin calls `PATCH /api/v1/admin/users/:id/status`, THE API SHALL toggle the user's `isActive` field and return the updated user document.
3. WHEN a superadmin calls `GET /api/v1/admin/stats`, THE API SHALL return platform-wide aggregate statistics including total users, total stores, total orders, and total revenue.
4. WHEN a superadmin deactivates a user account, THE API SHALL set `isActive: false` on the User document; subsequent login attempts by that user SHALL be rejected with HTTP 403.

### Requirement 16: Error Logging and Monitoring

**User Story:** As a platform operator, I want all server errors logged with context and forwarded to a monitoring service, so that I can diagnose and resolve production issues quickly.

#### Acceptance Criteria

1. THE Logger SHALL record every error with timestamp, error message, stack trace, request URL, and request method.
2. THE Logger SHALL support log levels: `error`, `warn`, and `info`.
3. WHILE `NODE_ENV` is `production`, THE Logger SHALL write errors to `logs/error.log` and all logs to `logs/combined.log`.
4. WHILE `NODE_ENV` is `development`, THE Logger SHALL output logs to the console.
5. THE System SHALL integrate `@sentry/node` to forward runtime errors to Sentry for real-time monitoring.
6. THE Logger SHALL never record passwords, JWT tokens, or other sensitive data in log output.

### Requirement 17: API Response Format

**User Story:** As a frontend developer, I want all API responses to follow a consistent structure, so that client-side error handling and data parsing are predictable.

#### Acceptance Criteria

1. THE API SHALL return all success responses in the format `{ "status": "success", "data": {}, "message": "..." }`.
2. THE API SHALL return all error responses in the format `{ "status": "error", "message": "...", "errors": [] }`.
3. THE Validator SHALL return validation errors as HTTP 422 with the format `{ "status": "error", "message": "Validation failed", "errors": [...] }`.

### Requirement 18: Frontend Authentication State

**User Story:** As a user, I want my login state to persist across page refreshes without storing tokens in the browser's local storage, so that my session is secure.

#### Acceptance Criteria

1. THE Client SHALL populate authentication state exclusively by calling `GET /api/v1/auth/me` on application load.
2. THE Client SHALL never store JWT tokens or user data in `localStorage` or `sessionStorage`.
3. THE AxiosInstance SHALL be configured with `withCredentials: true` so that cookies are sent with every request.
4. WHEN the AxiosInstance receives an HTTP 401 response, THE Client SHALL clear the AuthContext state and redirect the user to `/login`.
5. THE Client SHALL expose only `VITE_API_URL` as a client-side environment variable; no secrets SHALL be included in the client bundle.

### Requirement 19: Frontend Route Protection

**User Story:** As a platform operator, I want client-side routes to enforce role-based access, so that users cannot navigate to pages they are not authorized to view.

#### Acceptance Criteria

1. THE ProtectedRoute component SHALL redirect unauthenticated users to `/login` when they attempt to access any protected page.
2. WHEN an authenticated user attempts to access a route restricted to a different role, THE ProtectedRoute SHALL redirect them to an appropriate page (e.g., their own dashboard).
3. THE Client SHALL define separate route groups for buyer, seller, and superadmin pages, each wrapped in the appropriate ProtectedRoute configuration.

### Requirement 20: Public Home Page and Product Discovery

**User Story:** As a visitor or buyer, I want to browse all active products from all stores on the home page with search and category filtering, so that I can discover products I want to buy.

#### Acceptance Criteria

1. THE Client SHALL render a public home page that displays all active products fetched from `GET /api/v1/products` without requiring authentication.
2. WHEN a visitor enters a search term, THE Client SHALL filter the displayed products by name in real time or via a debounced API call.
3. WHEN a visitor selects a category filter, THE Client SHALL display only products matching that category.
4. THE Client SHALL display a company overview/about section on the home page.
5. THE Client SHALL provide a public About page at `/about` with static platform information.

### Requirement 21: Environment Configuration and Deployment Readiness

**User Story:** As a developer, I want all required environment variables documented and secrets excluded from version control, so that the application can be deployed safely to production.

#### Acceptance Criteria

1. THE System SHALL provide a `.env.example` file documenting all required server environment variables: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SENTRY_DSN`.
2. THE System SHALL provide a client-side `.env.example` documenting `VITE_API_URL`.
3. THE System SHALL include a `.gitignore` that excludes `.env`, `logs/`, and `node_modules/` from version control.
4. THE System SHALL never commit actual `.env` files containing secrets to the repository.
