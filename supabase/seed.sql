-- MedFind Initial Demo Seed Data
-- Run this in your Supabase SQL Editor to populate demo catalog and directory records.
-- All data is explicitly marked as simulated demo records.

-- ============================================================================
-- 1. SEED MEDICINES
-- ============================================================================
INSERT INTO public.medicines (id, generic_name, brand_name, strength, dosage_form, searchable_aliases)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Paracetamol', 'Demo-Calpol', '500 mg', 'Tablet', ARRAY['paracetamol', 'calpol', 'crocin', 'acetaminophen', 'fever']),
    ('a0000000-0000-0000-0000-000000000002', 'Amoxicillin', 'Demo-Mox', '250 mg', 'Capsule', ARRAY['amoxicillin', 'mox', 'antibiotic']),
    ('a0000000-0000-0000-0000-000000000003', 'Cetirizine', 'Demo-Cetzine', '10 mg', 'Tablet', ARRAY['cetirizine', 'cetzine', 'allergy']),
    ('a0000000-0000-0000-0000-000000000004', 'Salbutamol', 'Demo-Asthalin', '100 mcg', 'Inhaler', ARRAY['salbutamol', 'asthalin', 'inhaler', 'asthma']),
    ('a0000000-0000-0000-0000-000000000005', 'ORS Electrolyte', 'Demo-Electral', '21.8 g Sachet', 'Powder', ARRAY['ors', 'electral', 'rehydration', 'electrolyte'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SEED PARTICIPATING PHARMACIES (Fictional Demo Stores)
-- ============================================================================
INSERT INTO public.pharmacies (id, name, address, latitude, longitude, phone, participation_status, verified_at, opening_hours, is_demo)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Demo Pharmacy Alpha (Fictional)', '101 Simulation Boulevard, Demo Block A, Bengaluru', 12.9416, 77.5658, '080-0000-0001 [Demo - No Call Action]', 'participating', NOW(), '08:00 - 22:00 (Simulated)', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'Demo Chemists Beta (Fictional)', '202 Mock Avenue, Demo Block B, Bengaluru', 12.9430, 77.5680, '080-0000-0002 [Demo - No Call Action]', 'participating', NOW(), '24 Hours (Simulated)', TRUE),
    ('b0000000-0000-0000-0000-000000000003', 'Demo Healthcare Store Gamma (Fictional)', '303 Synthetic Road, Demo Block C, Bengaluru', 12.9390, 77.5620, '080-0000-0003 [Demo - No Call Action]', 'participating', NOW(), '09:00 - 21:00 (Simulated)', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. SEED DIRECTORY PROVIDER LISTINGS (Hospitals, Clinics, Ambulance Contacts)
-- ============================================================================
INSERT INTO public.provider_listings (id, type, name, address, latitude, longitude, phone, services, source, reviewed_at, is_demo)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'hospital', 'Demo Memorial Hospital Casualty Listing [Fictional]', '500 Simulation Park Way, Sector D, Bengaluru', 12.9450, 77.5670, '080-0000-0991 [Demo - No Call Action]', ARRAY['24/7 Casualty Desk (Directory Listing)', 'General Emergency Information'], 'BMSCE Faculty Review Seed Fixture', NOW(), TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'clinic', 'Demo Urban Health Center Listing [Fictional]', '502 Academic Lane, Sector E, Bengaluru', 12.9400, 77.5640, '080-0000-0992 [Demo - No Call Action]', ARRAY['Primary Care Consultation (Directory Listing)', 'Immunization'], 'BMSCE Faculty Review Seed Fixture', NOW(), TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'ambulance', 'Demo Emergency Ambulance Directory Contact [Fictional]', 'South Zone Simulation Depot, Bengaluru', 12.9420, 77.5660, '080-0000-0993 [Demo - No Call Action]', ARRAY['Directory Contact Reference Only (Zero Dispatch/Booking)'], 'BMSCE Faculty Review Seed Fixture', NOW(), TRUE)
ON CONFLICT (id) DO NOTHING;
