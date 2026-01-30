# Circular Economy Marketplace - Database Schema

Run these SQL commands in your Supabase SQL Editor to create the database tables.

## Tables

### 1. Buyers Table
```sql
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  preferred_materials TEXT[] DEFAULT '{}',
  location_city VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_buyers_email ON buyers(email);
```

### 2. Vendors Table
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  business_name VARCHAR(255),
  material_types TEXT[] DEFAULT '{}',
  quality_grades TEXT[] DEFAULT '{}',
  location_city VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  description TEXT,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_rating ON vendors(rating);
```

### 3. Informal Workers Table
```sql
CREATE TABLE informal_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  id_proof_type VARCHAR(50),
  service_area VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_informal_workers_user_id ON informal_workers(user_id);
CREATE INDEX idx_informal_workers_email ON informal_workers(email);
```

### 4. Listings Table
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  material_type VARCHAR(100) NOT NULL,
  quantity_kg DECIMAL(10, 2) NOT NULL,
  quality_grade VARCHAR(50),
  price_per_kg DECIMAL(10, 2) NOT NULL,
  description TEXT,
  location_address TEXT,
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_vendor_id ON listings(vendor_id);
CREATE INDEX idx_listings_material_type ON listings(material_type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
```

### 5. Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity_kg DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  pickup_address TEXT,
  pickup_date TIMESTAMP,
  delivery_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### 6. Reviews Table (Optional - for future enhancement)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
```

## Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE informal_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Buyers policies
CREATE POLICY "Buyers can view all buyers" ON buyers FOR SELECT USING (true);
CREATE POLICY "Buyers can update own profile" ON buyers FOR UPDATE USING (auth.uid() = user_id);

-- Vendors policies
CREATE POLICY "Anyone can view vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can update own profile" ON vendors FOR UPDATE USING (auth.uid() = user_id);

-- Informal workers policies
CREATE POLICY "Workers can view all workers" ON informal_workers FOR SELECT USING (true);
CREATE POLICY "Workers can update own profile" ON informal_workers FOR UPDATE USING (auth.uid() = user_id);

-- Listings policies
CREATE POLICY "Anyone can view listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Vendors can insert listings" ON listings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid() AND id = vendor_id)
);
CREATE POLICY "Vendors can update own listings" ON listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid() AND id = vendor_id)
);
CREATE POLICY "Vendors can delete own listings" ON listings FOR DELETE USING (
  EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid() AND id = vendor_id)
);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM buyers WHERE user_id = auth.uid() AND id = buyer_id)
  OR EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid() AND id = vendor_id)
);
CREATE POLICY "Buyers can create transactions" ON transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM buyers WHERE user_id = auth.uid() AND id = buyer_id)
);
CREATE POLICY "Transaction participants can update" ON transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM buyers WHERE user_id = auth.uid() AND id = buyer_id)
  OR EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid() AND id = vendor_id)
);
```

## Material Types Reference (Optional)
```sql
CREATE TABLE material_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100),
  description TEXT,
  base_market_price DECIMAL(10, 2),
  unit VARCHAR(20) DEFAULT 'kg',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO material_types (name, category, base_market_price) VALUES
  ('Plastic Bottles', 'Plastic', 15.00),
  ('Paper', 'Paper', 8.00),
  ('Cardboard', 'Paper', 10.00),
  ('Metal Scrap', 'Metal', 25.00),
  ('E-Waste', 'Electronics', 50.00),
  ('Glass', 'Glass', 5.00),
  ('Cotton Waste', 'Textile', 12.00);
```
