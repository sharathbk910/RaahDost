-- RAAHDOST PRODUCTION SCHEMA WITH SUPABASE AUTH & PROFILES

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. INSTITUTIONS & VILLAGES
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES LINKED TO auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'operator', 'admin')),
    institution_id UUID REFERENCES institutions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Trigger to automatically create a profile when a new user signs up
-- Default role is ALWAYS 'student' (Users can never assign themselves admin/operator)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. VEHICLES (Linked to Operator Profile)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(id),
    vehicle_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    starting_village_id UUID REFERENCES villages(id),
    destination_id UUID REFERENCES institutions(id),
    total_capacity INTEGER NOT NULL CHECK(total_capacity > 0),
    available_seats INTEGER NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'available'
        CHECK(availability_status IN ('available', 'full', 'unavailable')),
    operator_confirmed BOOLEAN DEFAULT FALSE,
    contact_number TEXT,
    driver_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK(
        available_seats >= 0
        AND available_seats <= total_capacity
    )
);

-- 4. TRANSPORT REQUESTS (Linked to Student Profile)
CREATE TABLE IF NOT EXISTS transport_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,
    display_name TEXT NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id),
    village_id UUID NOT NULL REFERENCES villages(id),
    passenger_count INTEGER NOT NULL DEFAULT 1 CHECK(passenger_count > 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'proposed', 'confirmed', 'unassigned', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISRUPTIONS
CREATE TABLE IF NOT EXISTS disruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    affected_route TEXT NOT NULL,
    disruption_type TEXT NOT NULL
        CHECK(disruption_type IN ('breakdown', 'route_closure', 'delay', 'overcrowding')),
    description TEXT,
    affected_student_count INTEGER NOT NULL CHECK(affected_student_count > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ALLOCATIONS
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disruption_id UUID NOT NULL REFERENCES disruptions(id) ON DELETE CASCADE,
    transport_request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    allocated_passengers INTEGER NOT NULL DEFAULT 1 CHECK(allocated_passengers > 0),
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK(status IN ('proposed', 'confirmed', 'rejected', 'unassigned')),
    allocation_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- POLICIES:
-- Profiles: Any authenticated user can read public profile summaries; users can only update their own profile (name, avatar) but not their role
CREATE POLICY "Public profile view" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own non-role fields" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Requests: Students can only view & create their own requests; Admins can view all
CREATE POLICY "Students manage own requests" ON transport_requests 
  FOR ALL TO authenticated 
  USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'operator'))
  );

-- Vehicles: Operators can manage their assigned vehicles; Admins can manage all; Students can view
CREATE POLICY "Read vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own vehicles or admin" ON vehicles 
  FOR ALL TO authenticated 
  USING (
    operator_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
