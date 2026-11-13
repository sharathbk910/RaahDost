-- RAAHDOST PRODUCTION RELATIONAL SCHEMA (SUPABASE POSTGRESQL)
-- Enforces referential integrity, capacity check constraints, and indexed lookups.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    student_code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    village_id UUID REFERENCES villages(id),
    destination_id UUID REFERENCES institutions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE transport_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    passenger_count INTEGER NOT NULL DEFAULT 1
        CHECK(passenger_count > 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'proposed', 'confirmed', 'unassigned', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    affected_route TEXT NOT NULL,
    disruption_type TEXT NOT NULL
        CHECK(disruption_type IN ('breakdown', 'route_closure', 'delay', 'overcrowding')),
    description TEXT,
    affected_student_count INTEGER NOT NULL
        CHECK(affected_student_count > 0),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disruption_id UUID NOT NULL REFERENCES disruptions(id),
    transport_request_id UUID NOT NULL REFERENCES transport_requests(id),
    vehicle_id UUID REFERENCES vehicles(id),
    allocated_passengers INTEGER NOT NULL DEFAULT 1
        CHECK(allocated_passengers > 0),
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK(status IN ('proposed', 'confirmed', 'rejected', 'unassigned')),
    allocation_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_students_village ON students(village_id);
CREATE INDEX idx_vehicles_availability ON vehicles(availability_status);
CREATE INDEX idx_transport_requests_status ON transport_requests(status);
CREATE INDEX idx_disruptions_status ON disruptions(status);
CREATE INDEX idx_allocations_disruption ON allocations(disruption_id);
CREATE INDEX idx_allocations_vehicle ON allocations(vehicle_id);

-- Row Level Security (RLS)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
