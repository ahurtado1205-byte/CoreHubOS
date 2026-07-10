-- Modificaciones a bookings
ALTER TABLE bookings
ADD COLUMN quote_id UUID,
ADD COLUMN confirmation_id TEXT,
ADD COLUMN nationality TEXT,
ADD COLUMN source TEXT,
ADD COLUMN rooms_count INTEGER DEFAULT 1,
ADD COLUMN rate_plan_id UUID,
ADD COLUMN nightly_rate NUMERIC(10,2),
ADD COLUMN total_nights INTEGER,
ADD COLUMN subtotal NUMERIC(10,2),
ADD COLUMN discount_type TEXT,
ADD COLUMN discount_value NUMERIC(10,2),
ADD COLUMN follow_up_date DATE,
ADD COLUMN pax INTEGER DEFAULT 1,
ADD COLUMN document_id TEXT,
ADD COLUMN dob DATE,
ADD COLUMN pre_checkin_completed BOOLEAN DEFAULT false,
ADD COLUMN companions JSONB;

-- CRM: Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  type TEXT DEFAULT 'guest',
  account_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM: Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  type TEXT DEFAULT 'individual',
  tentative_dates TEXT,
  pax INTEGER,
  rooms_count INTEGER,
  budget NUMERIC(10,2),
  notes TEXT,
  status TEXT DEFAULT 'new',
  agent_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP WITH TIME ZONE
);

-- CRM: Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  account_id UUID,
  primary_quote_id UUID,
  estimated_value NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  expected_close_date DATE,
  tentative_dates TEXT,
  rooms_count INTEGER,
  pax INTEGER,
  business_type TEXT,
  stage TEXT DEFAULT 'new',
  probability INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  lost_reason TEXT,
  agent_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  next_action TEXT,
  next_action_date DATE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRM: Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  confirmation_id TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  pax INTEGER DEFAULT 1,
  rooms_count INTEGER DEFAULT 1,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE SET NULL,
  rate_plan_id UUID,
  nightly_rate NUMERIC(10,2),
  total_nights INTEGER,
  subtotal NUMERIC(10,2),
  discount_type TEXT DEFAULT 'none',
  discount_value NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  source TEXT,
  expiration_date DATE,
  follow_up_date DATE,
  notes TEXT,
  internal_notes TEXT,
  assigned_agent UUID REFERENCES team_members(id) ON DELETE SET NULL,
  probability INTEGER,
  next_action TEXT,
  next_action_date DATE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  options JSONB
);

-- Actualizar opportunities con foreign key circular a quotes
ALTER TABLE opportunities ADD CONSTRAINT fk_primary_quote FOREIGN KEY (primary_quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_booking_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- CRM: Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  result TEXT,
  description TEXT,
  next_action TEXT,
  next_action_date DATE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES team_members(id) ON DELETE SET NULL
);

-- CRM: Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  agent_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for MVP" ON contacts FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON leads FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON opportunities FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON quotes FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON activities FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP" ON tasks FOR ALL USING (true);
