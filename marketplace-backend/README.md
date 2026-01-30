# Circular Economy Marketplace Backend

Complete backend for a circular economy marketplace connecting waste generators, vendors, buyers, and informal workers.

## Features

- ✅ **Supabase Authentication** with role-based access (buyer, vendor, informal_worker)
- ✅ **Smart Vendor Ranking** based on distance, quality, pricing, reviews, and demand/supply
- ✅ **Dynamic Price Recommendation** using real-time market signals
- ✅ **Listing Management** for recyclable materials
- ✅ **Transaction System** with status tracking
- ✅ **Digital Wallet** for informal workers
- ✅ **RESTful API** with Express.js

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **ORM**: Supabase Client

## Project Structure

```
marketplace-backend/
├── src/
│   ├── config/
│   │   └── supabase.js           # Supabase client setup
│   ├── controllers/
│   │   ├── authController.js     # Auth endpoints
│   │   ├── listingController.js  # Listing management
│   │   ├── transactionController.js
│   │   ├── vendorController.js
│   │   ├── buyerController.js
│   │   └── workerController.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT validation & role restriction
│   ├── models/
│   │   ├── Buyer.js
│   │   ├── Vendor.js
│   │   ├── InformalWorker.js
│   │   ├── Listing.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── listingRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── vendorRoutes.js
│   │   ├── buyerRoutes.js
│   │   └── workerRoutes.js
│   ├── utils/
│   │   ├── ranking.js            # Vendor ranking algorithm
│   │   └── pricing.js            # Price recommendation engine
│   └── app.js                    # Express app setup
├── server.js                     # Entry point
├── package.json
├── .env.example
└── DATABASE_SCHEMA.md            # SQL schema for Supabase
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd marketplace-backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Update `.env`:
```env
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database

1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Run the SQL commands from `DATABASE_SCHEMA.md`
4. This will create all tables, indexes, and RLS policies

### 4. Start Server

```bash
npm start         # Production
npm run dev       # Development (with nodemon)
```

Server runs on `http://localhost:5001`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile (protected)

### Listings
- `GET /api/listings` - Get all listings (with optional filters & ranking)
- `POST /api/listings` - Create listing (vendor only)
- `GET /api/listings/:id` - Get listing details
- `PUT /api/listings/:id` - Update listing (vendor only)
- `DELETE /api/listings/:id` - Delete listing (vendor only)
- `GET /api/listings/vendor/:vendorId` - Get vendor's listings
- `GET /api/listings/price-recommendation` - Get price recommendation

### Transactions
- `POST /api/transactions` - Create transaction (buyer only)
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/buyer/:buyerId?` - Get buyer transactions
- `GET /api/transactions/vendor/:vendorId?` - Get vendor transactions
- `PUT /api/transactions/:id` - Update transaction status

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor profile
- `PUT /api/vendors/profile` - Update vendor profile (vendor only)

### Buyers
- `GET /api/buyers` - Get all buyers
- `GET /api/buyers/:id` - Get buyer profile
- `PUT /api/buyers/profile` - Update buyer profile (buyer only)

### Informal Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker profile
- `PUT /api/workers/profile` - Update worker profile (worker only)
- `GET /api/workers/wallet/balance` - Get wallet balance (worker only)
- `POST /api/workers/wallet/add` - Add to wallet (worker only)

## Ranking System

The vendor ranking algorithm considers:

1. **Distance** (28%) - Haversine distance calculation
2. **Quality Grading** (22%) - Material quality score
3. **Pricing** (18%) - Competitive pricing (lower is better)
4. **Availability** (10%) - Boolean or quantity-based
5. **Reviews** (12%) - Vendor rating
6. **Demand/Supply** (10%) - Real-time market signals

Usage:
```javascript
GET /api/listings?buyer_lat=18.5204&buyer_lng=73.8567&material_type=Plastic
```

## Price Recommendation

Dynamic pricing based on:
- Base market price
- Quality grade multiplier (0.9-1.1x)
- Demand/supply multiplier (0.85-1.25x)
- Confidence score

Usage:
```javascript
GET /api/listings/price-recommendation?material_type=Plastic&base_market_price=15&quality_grade=8
```

## Authentication Flow

1. **Signup**: User registers with role (buyer/vendor/informal_worker)
2. **Profile Creation**: Automatic profile creation in respective table
3. **Login**: Returns JWT access token
4. **Protected Routes**: Include `Authorization: Bearer <token>` header
5. **Role Restriction**: Certain routes restricted by user role

## Example Requests

### Register Vendor
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Green Recyclers",
  "email": "vendor@example.com",
  "mobile": "9876543210",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "vendor",
  "additionalData": {
    "business_name": "Green Recyclers Pvt Ltd",
    "material_types": ["Plastic", "Paper"],
    "location_city": "Mumbai",
    "location_lat": 19.0760,
    "location_lng": 72.8777
  }
}
```

### Create Listing
```bash
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "material_type": "Plastic Bottles",
  "quantity_kg": 500,
  "quality_grade": "A",
  "price_per_kg": 15.50,
  "description": "Clean sorted PET bottles",
  "location_address": "Andheri East, Mumbai"
}
```

### Get Ranked Listings
```bash
GET /api/listings?buyer_lat=19.1136&buyer_lng=72.8697&material_type=Plastic
```

## Development Notes

- All routes use ES modules (`import/export`)
- Role-based access control via middleware
- Supabase RLS policies for database security
- Real-time distance calculation using Haversine formula
- Normalized scoring (0-1) for ranking factors

## Next Steps

1. Add review/rating system for transactions
2. Implement SMS/WhatsApp notifications
3. Add blockchain-inspired provenance tracking
4. Build admin dashboard
5. Add analytics endpoints
6. Implement search with filters
7. Add image upload for listings

## License

MIT
