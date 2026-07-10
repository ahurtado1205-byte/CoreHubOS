-- Create ENUM types for status and types
CREATE TYPE booking_status AS ENUM ('confirmed', 'pre_booked', 'deposit_paid', 'pending_payment');
CREATE TYPE unit_status AS ENUM ('active', 'out_of_order', 'out_of_service');
CREATE TYPE housekeeping_status AS ENUM ('clean', 'dirty', 'cleaning', 'inspected');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unit Types (Categories) Table
CREATE TABLE unit_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) DEFAULT 0,
  max_pax INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Units (Physical Rooms) Table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status unit_status DEFAULT 'active',
  housekeeping_status housekeeping_status DEFAULT 'clean',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team Members (Users) Table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE SET NULL,
  room_id UUID REFERENCES units(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  booking_status booking_status DEFAULT 'confirmed',
  total_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data (Properties & Admin Role)
INSERT INTO properties (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'CoreHub Hotel');
INSERT INTO roles (id, name, description, permissions) VALUES ('00000000-0000-0000-0000-000000000001', 'Administrador', 'Acceso Total', '{"all"}');
INSERT INTO team_members (first_name, last_name, email, role_id, property_id) 
VALUES ('Admin', 'Principal', 'admin@hotel.com', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

-- Set up Row Level Security (RLS) - Basic open rules for MVP, we will secure this later
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for MVP" ON properties FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON unit_types FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON units FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON roles FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON team_members FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON bookings FOR ALL USING (true);
