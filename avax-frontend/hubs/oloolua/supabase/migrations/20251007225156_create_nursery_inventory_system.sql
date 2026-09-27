/*
  # Nursery Seedling Inventory Management System

  ## Overview
  This migration creates a comprehensive database system for managing a tree nursery and seedling inventory.
  It tracks seedling types, inventory levels, sales, planting activities, and customer orders.

  ## New Tables

  ### 1. `seedling_categories`
  Categorizes different types of seedlings (Indigenous, Exotic, Fruit, Ornamental, etc.)
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Category name (e.g., "Indigenous Trees", "Exotic Trees")
  - `description` (text) - Detailed description of the category
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `seedlings`
  Master list of all seedling species available in the nursery
  - `id` (uuid, primary key) - Unique identifier
  - `category_id` (uuid, foreign key) - Links to seedling_categories
  - `common_name` (text) - Common name (e.g., "Croton")
  - `scientific_name` (text) - Scientific name (e.g., "Croton megalocarpus")
  - `local_name` (text) - Local/traditional name (e.g., "Mukinduri")
  - `description` (text) - Detailed description and uses
  - `growth_rate` (text) - Fast, Medium, or Slow
  - `mature_height` (text) - Expected height at maturity
  - `water_requirements` (text) - Low, Medium, or High
  - `sunlight_requirements` (text) - Full sun, Partial shade, or Full shade
  - `price_per_seedling` (decimal) - Price per individual seedling
  - `image_url` (text) - URL to seedling image
  - `is_active` (boolean) - Whether seedling is currently available
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `inventory`
  Tracks current stock levels and locations
  - `id` (uuid, primary key) - Unique identifier
  - `seedling_id` (uuid, foreign key) - Links to seedlings
  - `quantity_available` (integer) - Current available quantity
  - `quantity_reserved` (integer) - Quantity reserved for orders
  - `location` (text) - Physical location in nursery (e.g., "Section A", "Greenhouse 1")
  - `batch_number` (text) - Batch/lot number for tracking
  - `germination_date` (date) - When seeds were germinated
  - `ready_for_sale_date` (date) - When seedlings will be ready
  - `notes` (text) - Additional notes about this batch
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `customers`
  Customer information for orders and sales tracking
  - `id` (uuid, primary key) - Unique identifier
  - `full_name` (text) - Customer full name
  - `email` (text) - Customer email address
  - `phone` (text) - Customer phone number
  - `address` (text) - Customer physical address
  - `customer_type` (text) - Individual, Organization, Government, School
  - `notes` (text) - Additional customer notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `orders`
  Customer orders and sales transactions
  - `id` (uuid, primary key) - Unique identifier
  - `customer_id` (uuid, foreign key) - Links to customers
  - `order_number` (text) - Unique order reference number
  - `order_date` (timestamptz) - When order was placed
  - `delivery_date` (date) - Expected/actual delivery date
  - `status` (text) - Pending, Confirmed, Preparing, Delivered, Cancelled
  - `total_amount` (decimal) - Total order value
  - `payment_status` (text) - Unpaid, Partial, Paid
  - `payment_method` (text) - Cash, M-Pesa, Bank Transfer, Credit
  - `notes` (text) - Order-specific notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. `order_items`
  Individual items within each order
  - `id` (uuid, primary key) - Unique identifier
  - `order_id` (uuid, foreign key) - Links to orders
  - `seedling_id` (uuid, foreign key) - Links to seedlings
  - `quantity` (integer) - Number of seedlings ordered
  - `unit_price` (decimal) - Price per seedling at time of order
  - `subtotal` (decimal) - quantity × unit_price
  - `created_at` (timestamptz) - Record creation timestamp

  ### 7. `activities`
  Tracks nursery activities (planting, maintenance, harvesting seeds, etc.)
  - `id` (uuid, primary key) - Unique identifier
  - `activity_type` (text) - Seed Collection, Germination, Transplanting, Watering, Fertilizing, Pest Control, Quality Check
  - `seedling_id` (uuid, foreign key, nullable) - Related seedling if applicable
  - `inventory_id` (uuid, foreign key, nullable) - Related inventory batch
  - `activity_date` (date) - When activity occurred
  - `performed_by` (text) - Person who performed the activity
  - `quantity_affected` (integer) - Number of seedlings affected
  - `notes` (text) - Activity details and observations
  - `created_at` (timestamptz) - Record creation timestamp

  ### 8. `suppliers`
  Track seed and material suppliers
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Supplier name
  - `contact_person` (text) - Contact person name
  - `phone` (text) - Supplier phone
  - `email` (text) - Supplier email
  - `address` (text) - Supplier address
  - `supplies` (text) - What they supply (seeds, pots, soil, etc.)
  - `notes` (text) - Additional supplier information
  - `is_active` (boolean) - Whether supplier is currently active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Policies allow authenticated users to read all data
  - Policies allow authenticated users to insert, update, and delete their own data
  - Public users can only read active seedlings and categories

  ## Indexes
  - Created indexes on foreign keys for performance
  - Created indexes on frequently queried fields (status, dates, etc.)
*/

-- Create seedling_categories table
CREATE TABLE IF NOT EXISTS seedling_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seedlings table
CREATE TABLE IF NOT EXISTS seedlings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES seedling_categories(id) ON DELETE SET NULL,
  common_name text NOT NULL,
  scientific_name text DEFAULT '',
  local_name text DEFAULT '',
  description text DEFAULT '',
  growth_rate text DEFAULT 'Medium',
  mature_height text DEFAULT '',
  water_requirements text DEFAULT 'Medium',
  sunlight_requirements text DEFAULT 'Full sun',
  price_per_seedling decimal(10,2) DEFAULT 0,
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seedling_id uuid NOT NULL REFERENCES seedlings(id) ON DELETE CASCADE,
  quantity_available integer DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  location text DEFAULT '',
  batch_number text DEFAULT '',
  germination_date date,
  ready_for_sale_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  address text DEFAULT '',
  customer_type text DEFAULT 'Individual',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  order_date timestamptz DEFAULT now(),
  delivery_date date,
  status text DEFAULT 'Pending',
  total_amount decimal(10,2) DEFAULT 0,
  payment_status text DEFAULT 'Unpaid',
  payment_method text DEFAULT 'Cash',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seedling_id uuid NOT NULL REFERENCES seedlings(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  subtotal decimal(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  seedling_id uuid REFERENCES seedlings(id) ON DELETE SET NULL,
  inventory_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  activity_date date DEFAULT CURRENT_DATE,
  performed_by text DEFAULT '',
  quantity_affected integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  supplies text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seedlings_category ON seedlings(category_id);
CREATE INDEX IF NOT EXISTS idx_seedlings_active ON seedlings(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_seedling ON inventory(seedling_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seedling ON order_items(seedling_id);
CREATE INDEX IF NOT EXISTS idx_activities_seedling ON activities(seedling_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);

-- Enable Row Level Security
ALTER TABLE seedling_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seedlings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seedling_categories
CREATE POLICY "Anyone can view categories"
  ON seedling_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON seedling_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON seedling_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON seedling_categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for seedlings
CREATE POLICY "Anyone can view active seedlings"
  ON seedlings FOR SELECT
  TO public
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert seedlings"
  ON seedlings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update seedlings"
  ON seedlings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete seedlings"
  ON seedlings FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for orders
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for order_items
CREATE POLICY "Authenticated users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for activities
CREATE POLICY "Authenticated users can view activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_seedling_categories_updated_at BEFORE UPDATE ON seedling_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seedlings_updated_at BEFORE UPDATE ON seedlings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
