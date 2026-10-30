/**
 * Allergy definitions and comprehensive medical & allergen library.
 */

export const COMMON_ALLERGIES = [
  'Penicillin',
  'Aspirin',
  'Sulfa drugs',
  'Latex',
  'Peanuts',
  'Shellfish',
  'Dairy',
  'Gluten',
  'None',
] as const;

export const ALLERGY_CATEGORIES = [
  {
    category: 'Antibiotics & Antimicrobials',
    items: [
      'Penicillin',
      'Amoxicillin',
      'Ampicillin',
      'Cephalosporins (Cefixime, Ceftriaxone)',
      'Sulfa drugs (Sulfamethoxazole)',
      'Ciprofloxacin & Fluoroquinolones',
      'Levofloxacin',
      'Azithromycin',
      'Erythromycin & Macrolides',
      'Doxycycline & Tetracyclines',
      'Vancomycin',
      'Metronidazole',
      'Clindamycin',
      'Nitrofurantoin',
    ],
  },
  {
    category: 'Pain Relief & NSAIDs',
    items: [
      'Aspirin',
      'Ibuprofen',
      'Paracetamol (Acetaminophen)',
      'Diclofenac',
      'Naproxen',
      'Celecoxib',
      'Tramadol',
      'Codeine',
      'Morphine & Opioids',
    ],
  },
  {
    category: 'Clinical Agents & Medical Materials',
    items: [
      'Latex',
      'Lidocaine & Local Anesthetics',
      'Iodine & Contrast Dye',
      'Chlorhexidine (Antiseptic)',
      'Insulin',
      'General Anesthesia (Propofol)',
    ],
  },
  {
    category: 'Foods & Dietary',
    items: [
      'Peanuts',
      'Tree nuts (Almonds, Cashews, Walnuts)',
      'Shellfish (Shrimp, Crab, Lobster)',
      'Fish',
      'Dairy / Cow milk',
      'Gluten / Wheat',
      'Eggs',
      'Soy',
      'Sesame',
      'Mustard',
      'Corn',
      'Sulfites & Preservatives',
    ],
  },
  {
    category: 'Environmental & Airborne',
    items: [
      'Dust mites',
      'Pollen (Grass, Tree, Ragweed)',
      'Cat dander',
      'Dog dander',
      'Mold spores',
    ],
  },
  {
    category: 'Insects & Contact Allergens',
    items: [
      'Bee venom & Wasp stings',
      'Ant venom',
      'Nickel (Jewelry/Metal)',
      'Fragrances & Perfumes',
      'PPD (Hair dye)',
      'Sunscreen (PABA)',
    ],
  },
];

// Flat list of unique allergens
export const ALL_ALLERGENS: string[] = Array.from(
  new Set(ALLERGY_CATEGORIES.flatMap((c) => c.items))
).sort((a, b) => a.localeCompare(b));

/**
 * Filter allergens based on search query.
 * Prioritizes startsWith matches over contains matches.
 */
export function searchAllergies(query: string, maxResults: number = 12): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return ALL_ALLERGENS.slice(0, maxResults);
  }

  const prefixMatches: string[] = [];
  const substringMatches: string[] = [];

  for (const item of ALL_ALLERGENS) {
    const itemLower = item.toLowerCase();
    if (itemLower.startsWith(trimmed)) {
      prefixMatches.push(item);
    } else if (itemLower.includes(trimmed)) {
      substringMatches.push(item);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, maxResults);
}

