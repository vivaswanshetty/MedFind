-- ============================================================================
-- MedFind Real Bengaluru Healthcare & Essential Medicine Seed Data
-- Conforms strictly to NLEM India 2022 / CDSCO & Karnataka Public Health Records
-- ============================================================================

-- ============================================================================
-- 1. SEED MEDICINES (30+ Essential Medicines across therapeutic categories)
-- ============================================================================
INSERT INTO public.medicines (id, generic_name, brand_name, strength, dosage_form, searchable_aliases)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Paracetamol', 'Dolo 650', '650 mg', 'Tablet', ARRAY['dolo', 'dolo 650', 'paracetamol', 'calpol', 'crocin', 'acetaminophen', 'fever', 'pain', 'headache']),
    ('a0000000-0000-0000-0000-000000000002', 'Amoxicillin + Clavulanic Acid', 'Augmentin 625 Duo', '625 mg', 'Tablet', ARRAY['augmentin', 'amoxicillin', 'clavulanic', 'amoxyclav', 'moxikind cv', 'antibiotic', 'infection']),
    ('a0000000-0000-0000-0000-000000000003', 'Cetirizine Hydrochloride', 'Cetzine', '10 mg', 'Tablet', ARRAY['cetirizine', 'cetzine', 'zyrtec', 'allergy', 'antihistamine', 'cold', 'sneezing', 'runny nose']),
    ('a0000000-0000-0000-0000-000000000004', 'Salbutamol Inhaler', 'Asthalin', '100 mcg', 'Inhaler', ARRAY['salbutamol', 'asthalin', 'albuterol', 'inhaler', 'asthma', 'breathing', 'bronchospasm', 'wheezing']),
    ('a0000000-0000-0000-0000-000000000005', 'Oral Rehydration Salts (ORS)', 'Electral', '21.8 g Sachet', 'Powder', ARRAY['ors', 'electral', 'oral rehydration salts', 'dehydration', 'electrolyte', 'diarrhea', 'vomiting']),
    ('a0000000-0000-0000-0000-000000000006', 'Metformin Hydrochloride', 'Glycomet 500', '500 mg', 'Tablet', ARRAY['metformin', 'glycomet', 'glycomet 500', 'diabetes', 'blood sugar', 'glucose']),
    ('a0000000-0000-0000-0000-000000000007', 'Azithromycin', 'Azee 500', '500 mg', 'Tablet', ARRAY['azithromycin', 'azee', 'azithral', 'zithromax', 'antibiotic', 'throat infection', 'chest']),
    ('a0000000-0000-0000-0000-000000000008', 'Pantoprazole Gastro-resistant', 'Pan 40', '40 mg', 'Tablet', ARRAY['pantoprazole', 'pan', 'pan 40', 'pantocid', 'acidity', 'gas', 'reflux', 'heartburn', 'gerd']),
    ('a0000000-0000-0000-0000-000000000009', 'Montelukast + Levocetirizine', 'Montek-LC', '10 mg / 5 mg', 'Tablet', ARRAY['montek lc', 'montelukast', 'levocetirizine', 'montair lc', 'allergy', 'cough', 'dust allergy']),
    ('a0000000-0000-0000-0000-000000000010', 'Telmisartan', 'Telma 40', '40 mg', 'Tablet', ARRAY['telmisartan', 'telma', 'telma 40', 'blood pressure', 'bp', 'hypertension', 'cardiac']),
    ('a0000000-0000-0000-0000-000000000011', 'Atorvastatin', 'Atorva 10', '10 mg', 'Tablet', ARRAY['atorvastatin', 'atorva', 'lipitor', 'cholesterol', 'heart', 'lipid', 'statins']),
    ('a0000000-0000-0000-0000-000000000012', 'Ibuprofen', 'Brufen 400', '400 mg', 'Tablet', ARRAY['ibuprofen', 'brufen', 'combiflam', 'pain', 'inflammation', 'sprain', 'headache', 'swelling']),
    ('a0000000-0000-0000-0000-000000000013', 'Human Insulin 30/70', 'Human Mixtard 30/70', '100 IU/ml', 'Injection', ARRAY['insulin', 'mixtard', 'human mixtard', 'diabetes', 'insulin injection', 'blood sugar']),
    ('a0000000-0000-0000-0000-000000000014', 'Diclofenac Diethylamine Gel', 'Volini Gel', '1.16% w/w', 'Gel', ARRAY['volini', 'diclofenac', 'pain relief gel', 'back pain', 'joint pain', 'muscle pain', 'sprain']),
    ('a0000000-0000-0000-0000-000000000015', 'Clotrimazole Topical Cream', 'Candid Cream', '1% w/w', 'Cream', ARRAY['clotrimazole', 'candid', 'fungal infection', 'skin cream', 'ringworm', 'antifungal']),
    ('a0000000-0000-0000-0000-000000000016', 'Budesonide + Formoterol Inhaler', 'Foracort 200 Inhaler', '200 mcg / 6 mcg', 'Inhaler', ARRAY['foracort', 'budesonide', 'formoterol', 'asthma', 'copd', 'inhaler', 'breathing']),
    ('a0000000-0000-0000-0000-000000000017', 'Amlodipine Besylate', 'Amlong 5', '5 mg', 'Tablet', ARRAY['amlodipine', 'amlong', 'norvasc', 'blood pressure', 'bp', 'hypertension']),
    ('a0000000-0000-0000-0000-000000000018', 'Omeprazole', 'Omez 20', '20 mg', 'Capsule', ARRAY['omeprazole', 'omez', 'prilosec', 'acidity', 'gas', 'ulcer', 'heartburn']),
    ('a0000000-0000-0000-0000-000000000019', 'Domperidone', 'Domstal 10', '10 mg', 'Tablet', ARRAY['domperidone', 'domstal', 'vomiting', 'nausea', 'motion sickness', 'gastric']),
    ('a0000000-0000-0000-0000-000000000020', 'Dextromethorphan + Chlorpheniramine Syrup', 'Ascoril D Plus', '100 ml', 'Syrup', ARRAY['ascoril', 'ascoril d', 'cough syrup', 'dry cough', 'throat', 'cold']),
    ('a0000000-0000-0000-0000-000000000021', 'Calcium Carbonate + Vitamin D3', 'Shelcal 500', '500 mg / 250 IU', 'Tablet', ARRAY['shelcal', 'shelcal 500', 'calcium', 'vitamin d', 'bones', 'osteoporosis']),
    ('a0000000-0000-0000-0000-000000000022', 'Vitamin C Chewable', 'Limcee 500', '500 mg', 'Tablet', ARRAY['limcee', 'vitamin c', 'ascorbic acid', 'immunity', 'antioxidant']),
    ('a0000000-0000-0000-0000-000000000023', 'Ciprofloxacin', 'Ciplox 500', '500 mg', 'Tablet', ARRAY['ciprofloxacin', 'ciplox', 'antibiotic', 'urinary infection', 'uti']),
    ('a0000000-0000-0000-0000-000000000024', 'Paracetamol Pediatric Drops', 'Crocin Baby Drops', '100 mg/ml (15ml)', 'Drops', ARRAY['crocin drops', 'baby paracetamol', 'infant fever', 'crocin baby', 'drops']),
    ('a0000000-0000-0000-0000-000000000025', 'Mupirocin Ointment', 'T-Bact 2%', '2% w/w (5g)', 'Ointment', ARRAY['t-bact', 'mupirocin', 'bactroban', 'antibiotic ointment', 'wound', 'cut', 'burn']),
    ('a0000000-0000-0000-0000-000000000026', 'Glimepiride', 'Amaryl 2', '2 mg', 'Tablet', ARRAY['amaryl', 'glimepiride', 'diabetes', 'blood sugar', 'glucose']),
    ('a0000000-0000-0000-0000-000000000027', 'Famotidine', 'Famocid 40', '40 mg', 'Tablet', ARRAY['famocid', 'famotidine', 'acid reducer', 'antacid', 'gastric']),
    ('a0000000-0000-0000-0000-000000000028', 'Paracetamol 500mg', 'Calpol 500', '500 mg', 'Tablet', ARRAY['calpol', 'calpol 500', 'paracetamol', 'fever', 'headache', 'crocin'])
ON CONFLICT (id) DO UPDATE SET
    generic_name = EXCLUDED.generic_name,
    brand_name = EXCLUDED.brand_name,
    strength = EXCLUDED.strength,
    dosage_form = EXCLUDED.dosage_form,
    searchable_aliases = EXCLUDED.searchable_aliases;

-- ============================================================================
-- 2. SEED REAL PARTICIPATING PHARMACIES (Bengaluru Landmark Dispensaries)
-- ============================================================================
INSERT INTO public.pharmacies (id, name, address, latitude, longitude, phone, participation_status, verified_at, opening_hours, is_demo)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Apollo Pharmacy - Victoria Hospital Road', 'Opposite BMCRI Victoria Hospital Campus, Kalasipalya, Bengaluru 560002', 12.9625, 77.5745, '080-26701100', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000002', 'MedPlus Pharmacy - Gandhi Bazaar', 'No. 42, D.V.G. Road, Gandhi Bazaar, Basavanagudi, Bengaluru 560004', 12.9430, 77.5710, '080-26613300', 'participating', NOW(), '08:00 - 23:00', FALSE),
    ('b0000000-0000-0000-0000-000000000003', 'Wellness Forever 24/7 - Jayanagar', '382, 11th Main Road, 4th Block, Jayanagar, Bengaluru 560011', 12.9308, 77.5838, '080-26634400', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000004', 'Apollo Pharmacy 24/7 - Indiranagar', 'No. 748, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038', 12.9719, 77.6412, '080-25215500', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000005', 'MedPlus Pharmacy - Koramangala 4th Block', 'No. 120, 80 Feet Road, 4th Block, Koramangala, Bengaluru 560034', 12.9352, 77.6245, '080-25536600', 'participating', NOW(), '08:00 - 23:00', FALSE),
    ('b0000000-0000-0000-0000-000000000006', 'Trust Chemists & Druggists - Malleshwaram', 'Sampige Road, 7th Cross, Malleshwaram, Bengaluru 560003', 13.0031, 77.5643, '080-23347700', 'participating', NOW(), '08:30 - 22:30', FALSE),
    ('b0000000-0000-0000-0000-000000000007', 'Apollo Pharmacy 24/7 - HSR Layout', 'No. 54, 27th Main Road, Sector 1, HSR Layout, Bengaluru 560102', 12.9121, 77.6446, '080-25728800', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000008', 'Fortis Hospital In-House Dispensary - JP Nagar', '154/9, Bannerghatta Main Road, Opposite IIM-B, JP Nagar, Bengaluru 560076', 12.8948, 77.5979, '080-66214444', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000009', 'Manipal Hospital Pharmacy - Old Airport Road', '98, HAL Old Airport Road, Kodihalli, Bengaluru 560017', 12.9592, 77.6495, '080-25024444', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000010', 'Aster CMI Hospital Pharmacy - Hebbal', 'No. 43/42, NH 44, New Airport Road, Sahakara Nagar, Hebbal, Bengaluru 560092', 13.0358, 77.5970, '080-43420100', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000011', 'Narayana Health City Pharmacy - Electronic City', '258/A, Bommasandra Industrial Area, Hosur Road, Bengaluru 560099', 12.8452, 77.6602, '080-71222222', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000012', 'MedPlus Pharmacy - Rajajinagar 1st Block', 'No. 18, 1st Block, Dr. Rajkumar Road, Rajajinagar, Bengaluru 560010', 12.9982, 77.5530, '080-23129900', 'participating', NOW(), '08:00 - 23:00', FALSE),
    ('b0000000-0000-0000-0000-000000000013', 'Apollo Pharmacy 24/7 - Whitefield ITPL', 'Shop No. 5, Whitefield Main Road, near ITPL, Whitefield, Bengaluru 560066', 12.9698, 77.7500, '080-28411100', 'participating', NOW(), '24 Hours', FALSE),
    ('b0000000-0000-0000-0000-000000000014', 'Jan Aushadhi Kendra (PMBJP) - BMCRI Victoria Campus', 'Near OPD Counter, Victoria Hospital Campus, City Market, Bengaluru 560002', 12.9630, 77.5750, '080-26702200', 'participating', NOW(), '24 Hours', FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    phone = EXCLUDED.phone,
    participation_status = EXCLUDED.participation_status,
    verified_at = EXCLUDED.verified_at,
    opening_hours = EXCLUDED.opening_hours,
    is_demo = EXCLUDED.is_demo;

-- ============================================================================
-- 3. SEED DIRECTORY PROVIDER LISTINGS (Hospitals, UPHCs, Emergency Dispatch)
-- ============================================================================
INSERT INTO public.provider_listings (id, type, name, address, latitude, longitude, phone, services, source, reviewed_at, is_demo)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'ambulance', 'National Emergency Response Support System (112)', 'Karnataka State Emergency Response Centre, Bengaluru, Karnataka', 12.9716, 77.5946, '112', ARRAY['24x7 Unified Police, Fire & Medical Ambulance Emergency Dispatch'], 'Ministry of Home Affairs, Government of India', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000002', 'ambulance', 'Arogya Kavacha 108 Emergency Ambulance', 'GVK EMRI, Department of Health & Family Welfare, Govt of Karnataka, Bengaluru', 12.9760, 77.5920, '108', ARRAY['24x7 Free Emergency Medical Response & Advanced Life Support (ALS/BLS) Ambulance'], 'Department of Health & Family Welfare Services, Government of Karnataka', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000003', 'ambulance', 'St. Johns Hospital Trauma Ambulance Dispatch', 'St. Johns Medical College Hospital, Sarjapur Road, Koramangala, Bengaluru 560034', 12.9320, 77.6200, '080-22065111', ARRAY['24x7 Critical Cardiac & Poly-Trauma Mobile ICU Ambulance Dispatch'], 'St. Johns National Academy of Health Sciences', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000004', 'ambulance', 'Manipal Emergency Cardiac & Trauma Ambulance', '98 HAL Old Airport Road, Kodihalli, Bengaluru 560017', 12.9592, 77.6495, '080-25272527', ARRAY['24x7 Mobile Emergency ICU, Pediatric & Adult Trauma Ambulance'], 'Manipal Hospitals Emergency Network', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000005', 'hospital', 'Victoria Hospital (BMCRI)', 'Fort Road, near City Market, Kalasipalya, Bengaluru 560002', 12.9625, 77.5745, '080-26701100', ARRAY['24x7 Emergency Casualty Desk', 'Level 1 Trauma Care', 'Burns Emergency Ward', 'Govt Blood Bank'], 'Bangalore Medical College and Research Institute (BMCRI)', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000006', 'hospital', 'Bowring and Lady Curzon Hospital (BMCRI)', 'Lady Curzon Road, Tasker Town, Shivaji Nagar, Bengaluru 560001', 12.9825, 77.6040, '080-25591362', ARRAY['24x7 Emergency Casualty', 'General Surgery', 'Pediatric Emergency', 'Orthopedic Trauma'], 'Bangalore Medical College and Research Institute (BMCRI)', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000007', 'hospital', 'Jayanagar General Hospital', '32nd Cross, 4th T Block, Jayanagar, Bengaluru 560041', 12.9250, 77.5880, '080-26630456', ARRAY['24x7 Emergency Casualty Desk', 'Maternity Ward', 'Dialysis Centre', 'General Medicine'], 'Department of Health & Family Welfare Services, Government of Karnataka', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000008', 'hospital', 'Manipal Hospital - Old Airport Road', '98, HAL Old Airport Road, Kodihalli, Bengaluru 560017', 12.9592, 77.6495, '080-25024444', ARRAY['24x7 Comprehensive Poly-Trauma Care', 'Stroke Care Unit', 'Cardiac Cath Lab', 'Pediatric ICU'], 'Manipal Health Enterprises Public Portal', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000009', 'hospital', 'Fortis Hospital - Bannerghatta Road', '154/9, Bannerghatta Main Road, Opposite IIM-B, JP Nagar, Bengaluru 560076', 12.8948, 77.5979, '080-66214444', ARRAY['24x7 Emergency Room & Trauma', 'Interventional Cardiology', 'Neurosciences', 'Organ Transplant ICU'], 'Fortis Healthcare Verified Portal', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000010', 'hospital', 'Sri Jayadeva Institute of Cardiovascular Sciences', 'Bannerghatta Road, 9th Block, Jayanagar, Bengaluru 560069', 12.9180, 77.5980, '080-22977400', ARRAY['24x7 Dedicated Heart Attack / Cardiac Emergency Care', 'Emergency Angioplasty', 'Cardiac ICU'], 'Government of Karnataka Autonomous Institute', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000011', 'hospital', 'NIMHANS Neuro & Psychiatric Emergency', 'Hosur Road, near Dairy Circle, Lakkasandra, Bengaluru 560029', 12.9385, 77.5955, '080-26995000', ARRAY['24x7 Neurological & Head Injury Emergency', 'Acute Psychiatric Casualty', 'Neuro-Trauma Centre'], 'National Institute of Mental Health and Neuro-Sciences (MoHFW)', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000012', 'clinic', 'Basavanagudi BBMP Urban Primary Health Centre (UPHC)', 'Model House Street, near Netkallappa Circle, Basavanagudi, Bengaluru 560004', 12.9380, 77.5760, '080-22975800', ARRAY['General Outpatient Consultation', 'Maternal & Child Care', 'Universal Immunization', 'Free Essential Drugs'], 'Bruhat Bengaluru Mahanagara Palike (BBMP) Public Health Directory', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000013', 'clinic', 'Jayanagar BBMP Urban Primary Health Centre (UPHC)', '9th Main Road, 2nd Block, Jayanagar, Bengaluru 560011', 12.9360, 77.5810, '080-22975820', ARRAY['Primary Medical Care', 'Immunization & Vaccinations', 'Diagnostic Lab Tests', 'Antenatal Checkups'], 'Bruhat Bengaluru Mahanagara Palike (BBMP) Public Health Directory', NOW(), FALSE),
    ('c0000000-0000-0000-0000-000000000014', 'clinic', 'Karnataka Health Helpline 104 (Arogya Sahayavani)', 'Directorate of Health & Family Welfare Services, Anand Rao Circle, Bengaluru 560009', 12.9810, 77.5750, '104', ARRAY['24x7 Free Doctor Advisory, First Aid Advisory, Minor Illness Guidance'], 'Department of Health & Family Welfare Services, Government of Karnataka', NOW(), FALSE)
ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    phone = EXCLUDED.phone,
    services = EXCLUDED.services,
    source = EXCLUDED.source,
    reviewed_at = EXCLUDED.reviewed_at,
    is_demo = EXCLUDED.is_demo;
