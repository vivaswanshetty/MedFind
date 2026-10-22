-- MedFind Initial Relational Schema & Row Level Security (RLS)
-- BMSCE CSE Semester 5 Mini Project (October 2026)
--
-- Conforms strictly to:
-- - PRD.docx Section 6 (Non-functional & safety) & Section 7 (Data model)
-- - Tech Stack.docx Section 3 (System shape), Section 4 (Data model), Section 5 (Security)
--
-- Note: This migration is prepared for local review and team deployment.
-- Do NOT run against unconfigured cloud environments.

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MEDICINES
-- Descriptor catalog for exact medicine lookups (no automatic substitution)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    strength TEXT,
    dosage_form TEXT,
    searchable_aliases TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON public.medicines(LOWER(generic_name));
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name ON public.medicines(LOWER(brand_name));

-- ============================================================================
-- 2. PHARMACIES
-- Only participating pharmacies are listed in search
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone TEXT NOT NULL,
    participation_status TEXT NOT NULL CHECK (participation_status IN ('participating', 'pending_review', 'inactive')),
    verified_at TIMESTAMPTZ,
    opening_hours TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_participation ON public.pharmacies(participation_status);

-- ============================================================================
-- 3. USER PROFILES
-- Role-based access control linking Supabase Auth to pharmacy assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'pharmacy_staff', 'admin')),
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE SET NULL,
    consent_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. STOCK SNAPSHOTS
-- Append-only availability event log preserving exact timestamps
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('available', 'low_stock', 'unavailable', 'unknown')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES auth.users(id),
    note TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_stock_snapshots_lookup 
    ON public.stock_snapshots(medicine_id, pharmacy_id, updated_at DESC);

-- View representing the latest stock snapshot for each medicine at each pharmacy
CREATE OR REPLACE VIEW public.current_stock_records AS
SELECT DISTINCT ON (pharmacy_id, medicine_id)
    s.id AS snapshot_id,
    s.pharmacy_id,
    s.medicine_id,
    s.state,
    s.updated_at,
    s.updated_by,
    s.note,
    s.is_demo,
    p.name AS pharmacy_name,
    p.address AS pharmacy_address,
    p.phone AS pharmacy_phone,
    p.participation_status,
    m.generic_name,
    m.brand_name,
    m.strength,
    m.dosage_form
FROM public.stock_snapshots s
JOIN public.pharmacies p ON s.pharmacy_id = p.id
JOIN public.medicines m ON s.medicine_id = m.id
WHERE p.participation_status = 'participating'
ORDER BY pharmacy_id, medicine_id, updated_at DESC;

-- ============================================================================
-- 5. PROVIDER LISTINGS
-- Directory-only records for hospitals, clinics, and ambulance contacts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.provider_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'ambulance')),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone TEXT NOT NULL,
    services TEXT[] DEFAULT '{}',
    source TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_type ON public.provider_listings(type);

-- ============================================================================
-- 6. AUDIT EVENTS
-- Immutable audit log for all stock mutations and administrative moderation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_occurred_at ON public.audit_events(occurred_at DESC);

-- Trigger to record audit events on stock snapshot insertion
CREATE OR REPLACE FUNCTION public.fn_audit_stock_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_events (actor_id, action, entity, entity_id, occurred_at, metadata)
    VALUES (
        NEW.updated_by,
        'CREATE_STOCK_SNAPSHOT',
        'stock_snapshots',
        NEW.id::TEXT,
        NOW(),
        jsonb_build_object(
            'pharmacy_id', NEW.pharmacy_id,
            'medicine_id', NEW.medicine_id,
            'state', NEW.state,
            'updated_at', NEW.updated_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_stock_snapshot ON public.stock_snapshots;
CREATE TRIGGER trg_audit_stock_snapshot
AFTER INSERT ON public.stock_snapshots
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_stock_snapshot();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict role and pharmacy boundary enforcement
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Medicines: Public read-only; admin write
CREATE POLICY "Medicines are viewable by everyone" 
    ON public.medicines FOR SELECT 
    USING (true);

-- Pharmacies: Public can only view participating pharmacies
CREATE POLICY "Participating pharmacies viewable by public" 
    ON public.pharmacies FOR SELECT 
    USING (participation_status = 'participating' OR auth.jwt() ->> 'role' = 'admin');

-- User Profiles: Users read their own profile; admins read all
CREATE POLICY "Users read own profile" 
    ON public.user_profiles FOR SELECT 
    USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users update own consent" 
    ON public.user_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Stock Snapshots:
-- 1. Read: Public can view snapshots for participating pharmacies
CREATE POLICY "Public read stock snapshots" 
    ON public.stock_snapshots FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.pharmacies p 
            WHERE p.id = stock_snapshots.pharmacy_id 
              AND p.participation_status = 'participating'
        )
    );

-- 2. Insert: Pharmacy staff can ONLY insert records for their assigned pharmacy
CREATE POLICY "Pharmacy staff insert own snapshots" 
    ON public.stock_snapshots FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
              AND (
                  (up.role = 'pharmacy_staff' AND up.pharmacy_id = stock_snapshots.pharmacy_id)
                  OR up.role = 'admin'
              )
        )
    );

-- 3. Prevent any update or delete (Append-only invariant)
-- No UPDATE or DELETE policies are declared, thereby denying modifications.

-- Provider Listings: Public read-only
CREATE POLICY "Provider listings viewable by everyone" 
    ON public.provider_listings FOR SELECT 
    USING (true);

-- Audit Events: Admins only
CREATE POLICY "Audit events readable only by admin" 
    ON public.audit_events FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
        )
    );
