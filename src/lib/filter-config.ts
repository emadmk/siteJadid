/**
 * Product Filter Configuration
 * Defines filter options for different product categories
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean; // Allow multiple selections
}

export interface CategoryFilters {
  categorySlug: string | string[]; // Can match multiple category slugs
  filters: FilterGroup[];
}

// ===== COMMON FILTER OPTIONS =====

export const GENDER_OPTIONS: FilterOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
];

export const COMMON_COLORS: FilterOption[] = [
  { value: 'black', label: 'Black' },
  { value: 'navy', label: 'Navy' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'brown', label: 'Brown' },
  { value: 'white', label: 'White' },
  { value: 'gray', label: 'Gray' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
];

// ===== FOOTWEAR FILTERS =====

export const FOOTWEAR_FILTERS: FilterGroup[] = [
  {
    key: 'toeType',
    label: 'Toe Type',
    options: [
      { value: 'safety-toe', label: 'Safety Toe' },
      { value: 'soft-toe', label: 'Soft Toe / Casual' },
      { value: 'composite-toe', label: 'Composite Toe' },
      { value: 'steel-toe', label: 'Steel Toe' },
    ],
  },
  {
    key: 'gender',
    label: 'Gender',
    options: GENDER_OPTIONS,
  },
  {
    key: 'material',
    label: 'Material',
    options: [
      { value: 'leather', label: 'Leather' },
      { value: 'rubber', label: 'Rubber' },
      { value: 'nylon', label: 'Nylon' },
      { value: 'synthetic', label: 'Synthetic' },
      { value: 'polyester', label: 'Polyester' },
      { value: 'suede', label: 'Suede' },
    ],
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: COMMON_COLORS,
    multiple: true,
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      { value: 'tactical', label: 'Tactical' },
      { value: 'boot', label: 'Boot' },
      { value: 'sneaker', label: 'Sneaker' },
      { value: 'shoe', label: 'Shoe' },
      { value: 'oxford', label: 'Oxford' },
      { value: '6-inch', label: '6 Inch' },
      { value: '8-inch', label: '8 Inch' },
      { value: 'athletic', label: 'Athletic' },
      { value: 'wellington', label: 'Gum/Wellington' },
    ],
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'fire-resistant', label: 'Fire Resistant' },
      { value: 'slip-resistant', label: 'Slip Resistant' },
      { value: 'waterproof', label: 'Waterproof' },
      { value: 'insulated', label: 'Insulated' },
      { value: 'electrical-hazard', label: 'Electrical Hazard' },
      { value: 'puncture-resistant', label: 'Puncture Resistant' },
    ],
    multiple: true,
  },
];

// ===== HIGH VISIBILITY CLOTHING FILTERS =====

export const HIVIS_TYPE_OPTIONS: FilterOption[] = [
  { value: 'ansi-class-2', label: 'ANSI Class 2' },
  { value: 'ansi-class-3', label: 'ANSI Class 3' },
  { value: 'non-ansi', label: 'Non-ANSI' },
  { value: 'incident-command', label: 'Incident Command' },
  { value: 'breakaway', label: 'Breakaway' },
  { value: 'fire-retardant', label: 'Fire Retardant' },
];

export const HIVIS_COLORS: FilterOption[] = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'lime', label: 'Lime Green' },
  { value: 'multi-color', label: 'Multi Color' },
];

export const FABRIC_OPTIONS: FilterOption[] = [
  { value: 'mesh', label: 'Mesh' },
  { value: 'tricot-solid', label: 'Tricot / Solid' },
  { value: 'polyester', label: 'Polyester' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'fleece', label: 'Fleece' },
];

// Safety Vests
export const SAFETY_VEST_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: HIVIS_TYPE_OPTIONS,
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: HIVIS_COLORS,
    multiple: true,
  },
  {
    key: 'fabric',
    label: 'Fabric',
    options: FABRIC_OPTIONS,
    multiple: true,
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      { value: 'zipper', label: 'Zipper' },
      { value: 'velcro', label: 'Velcro' },
      { value: 'breakaway', label: 'Breakaway' },
      { value: 'surveyor', label: 'Surveyor' },
    ],
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'insulated', label: 'Insulated' },
      { value: 'fire-retardant', label: 'Fire Retardant' },
      { value: 'anti-static', label: 'Anti-Static' },
    ],
    multiple: true,
  },
];

// Jackets
export const JACKET_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: HIVIS_TYPE_OPTIONS,
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: HIVIS_COLORS,
    multiple: true,
  },
  {
    key: 'fabric',
    label: 'Fabric',
    options: FABRIC_OPTIONS,
    multiple: true,
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      { value: 'windbreaker', label: 'Windbreaker' },
      { value: 'full-length-parka', label: 'Full Length / Parka' },
      { value: 'bomber-style', label: 'Bomber Style' },
      { value: 'softshell', label: 'Softshell' },
    ],
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'waterproof', label: 'Waterproof' },
      { value: 'fire-retardant', label: 'Fire Retardant' },
      { value: 'anti-static', label: 'Anti-Static' },
      { value: 'insulated', label: 'Insulated' },
    ],
    multiple: true,
  },
];

// T-Shirts
export const TSHIRT_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'ansi-class-2', label: 'ANSI Class 2' },
      { value: 'ansi-class-3', label: 'ANSI Class 3' },
      { value: 'non-ansi', label: 'Non-ANSI' },
    ],
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: HIVIS_COLORS,
    multiple: true,
  },
  {
    key: 'fabric',
    label: 'Fabric',
    options: [
      { value: 'polyester', label: 'Polyester' },
      { value: 'cotton', label: 'Cotton' },
      { value: 'poly-cotton', label: 'Poly-Cotton Blend' },
    ],
    multiple: true,
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      { value: 'long-sleeve', label: 'Long Sleeve' },
      { value: 'short-sleeve', label: 'Short Sleeve' },
    ],
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'uv-protection', label: 'UV Protection' },
      { value: 'bug-repellent', label: 'Bug Repellent' },
      { value: 'moisture-wicking', label: 'Moisture Wicking' },
    ],
    multiple: true,
  },
];

// High Visibility General (parent category)
export const HIVIS_GENERAL_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: HIVIS_TYPE_OPTIONS,
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: HIVIS_COLORS,
    multiple: true,
  },
  {
    key: 'fabric',
    label: 'Fabric',
    options: FABRIC_OPTIONS,
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'waterproof', label: 'Waterproof' },
      { value: 'fire-retardant', label: 'Fire Retardant' },
      { value: 'anti-static', label: 'Anti-Static' },
      { value: 'insulated', label: 'Insulated' },
      { value: 'uv-protection', label: 'UV Protection' },
    ],
    multiple: true,
  },
];

// ===== GLOVES FILTERS =====

export const GLOVES_FILTERS: FilterGroup[] = [
  {
    key: 'cutLevel',
    label: 'Cut Level',
    options: [
      { value: 'a1', label: 'ANSI A1' },
      { value: 'a2', label: 'ANSI A2' },
      { value: 'a3', label: 'ANSI A3' },
      { value: 'a4', label: 'ANSI A4' },
      { value: 'a5', label: 'ANSI A5' },
      { value: 'a6', label: 'ANSI A6' },
      { value: 'a7', label: 'ANSI A7' },
      { value: 'a8', label: 'ANSI A8' },
      { value: 'a9', label: 'ANSI A9' },
    ],
    multiple: true,
  },
  {
    key: 'coating',
    label: 'Coating',
    options: [
      { value: 'nitrile', label: 'Nitrile' },
      { value: 'latex', label: 'Latex' },
      { value: 'pu', label: 'Polyurethane (PU)' },
      { value: 'pvc', label: 'PVC' },
      { value: 'uncoated', label: 'Uncoated' },
    ],
    multiple: true,
  },
  {
    key: 'material',
    label: 'Material',
    options: [
      { value: 'leather', label: 'Leather' },
      { value: 'kevlar', label: 'Kevlar' },
      { value: 'nylon', label: 'Nylon' },
      { value: 'cotton', label: 'Cotton' },
      { value: 'hppe', label: 'HPPE' },
    ],
    multiple: true,
  },
  {
    key: 'protection',
    label: 'Protection',
    options: [
      { value: 'cut-resistant', label: 'Cut Resistant' },
      { value: 'heat-resistant', label: 'Heat Resistant' },
      { value: 'chemical-resistant', label: 'Chemical Resistant' },
      { value: 'impact-resistant', label: 'Impact Resistant' },
      { value: 'waterproof', label: 'Waterproof' },
      { value: 'cold-weather', label: 'Cold Weather' },
    ],
    multiple: true,
  },
];

// ===== EYE PROTECTION FILTERS =====

export const EYEWEAR_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'safety-glasses', label: 'Safety Glasses' },
      { value: 'goggles', label: 'Goggles' },
      { value: 'face-shield', label: 'Face Shield' },
      { value: 'welding', label: 'Welding' },
    ],
    multiple: true,
  },
  {
    key: 'lensColor',
    label: 'Lens Color',
    options: [
      { value: 'clear', label: 'Clear' },
      { value: 'gray', label: 'Gray / Smoke' },
      { value: 'amber', label: 'Amber' },
      { value: 'blue', label: 'Blue Mirror' },
      { value: 'indoor-outdoor', label: 'Indoor/Outdoor' },
    ],
    multiple: true,
  },
  {
    key: 'features',
    label: 'Features',
    options: [
      { value: 'anti-fog', label: 'Anti-Fog' },
      { value: 'anti-scratch', label: 'Anti-Scratch' },
      { value: 'uv-protection', label: 'UV Protection' },
      { value: 'polarized', label: 'Polarized' },
      { value: 'prescription-ready', label: 'Prescription Ready' },
    ],
    multiple: true,
  },
];

// ===== HEAD PROTECTION FILTERS =====

export const HEAD_PROTECTION_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'hard-hat', label: 'Hard Hat' },
      { value: 'bump-cap', label: 'Bump Cap' },
      { value: 'climbing-helmet', label: 'Climbing Helmet' },
      { value: 'welding-helmet', label: 'Welding Helmet' },
    ],
    multiple: true,
  },
  {
    key: 'class',
    label: 'Class',
    options: [
      { value: 'class-e', label: 'Class E (Electrical)' },
      { value: 'class-g', label: 'Class G (General)' },
      { value: 'class-c', label: 'Class C (Conductive)' },
    ],
    multiple: true,
  },
  {
    key: 'color',
    label: 'Color',
    options: [
      { value: 'white', label: 'White' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'orange', label: 'Orange' },
      { value: 'blue', label: 'Blue' },
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
    ],
    multiple: true,
  },
  {
    key: 'features',
    label: 'Features',
    options: [
      { value: 'vented', label: 'Vented' },
      { value: 'ratchet-suspension', label: 'Ratchet Suspension' },
      { value: 'full-brim', label: 'Full Brim' },
      { value: 'cap-style', label: 'Cap Style' },
    ],
    multiple: true,
  },
];

// ===== HEARING PROTECTION FILTERS =====

export const HEARING_PROTECTION_FILTERS: FilterGroup[] = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'earplugs', label: 'Earplugs' },
      { value: 'earmuffs', label: 'Earmuffs' },
      { value: 'banded', label: 'Banded' },
      { value: 'electronic', label: 'Electronic' },
    ],
    multiple: true,
  },
  {
    key: 'nrr',
    label: 'NRR Rating',
    options: [
      { value: 'nrr-20-25', label: 'NRR 20-25' },
      { value: 'nrr-26-30', label: 'NRR 26-30' },
      { value: 'nrr-31-plus', label: 'NRR 31+' },
    ],
    multiple: true,
  },
];

// ===== CATEGORY TO FILTER MAPPING =====

export const CATEGORY_FILTER_MAP: Record<string, FilterGroup[]> = {
  // Footwear
  'footwear': FOOTWEAR_FILTERS,
  'boots': FOOTWEAR_FILTERS,
  'shoes': FOOTWEAR_FILTERS,
  'safety-footwear': FOOTWEAR_FILTERS,
  'work-boots': FOOTWEAR_FILTERS,

  // High Visibility
  'high-visibility': HIVIS_GENERAL_FILTERS,
  'high-visibility-clothing': HIVIS_GENERAL_FILTERS,
  'hi-vis': HIVIS_GENERAL_FILTERS,
  'safety-vests': SAFETY_VEST_FILTERS,
  'vests': SAFETY_VEST_FILTERS,
  'jackets': JACKET_FILTERS,
  'hi-vis-jackets': JACKET_FILTERS,
  't-shirts': TSHIRT_FILTERS,
  'hi-vis-shirts': TSHIRT_FILTERS,

  // Gloves
  'gloves': GLOVES_FILTERS,
  'work-gloves': GLOVES_FILTERS,
  'safety-gloves': GLOVES_FILTERS,
  'hand-protection': GLOVES_FILTERS,

  // Eye Protection
  'eye-protection': EYEWEAR_FILTERS,
  'eyewear': EYEWEAR_FILTERS,
  'safety-glasses': EYEWEAR_FILTERS,

  // Head Protection
  'head-protection': HEAD_PROTECTION_FILTERS,
  'hard-hats': HEAD_PROTECTION_FILTERS,
  'helmets': HEAD_PROTECTION_FILTERS,

  // Hearing Protection
  'hearing-protection': HEARING_PROTECTION_FILTERS,
  'earplugs': HEARING_PROTECTION_FILTERS,
  'earmuffs': HEARING_PROTECTION_FILTERS,
};

// Default filters for categories not in the map
export const DEFAULT_FILTERS: FilterGroup[] = [
  {
    key: 'color',
    label: 'Color',
    options: COMMON_COLORS,
    multiple: true,
  },
];

/**
 * Get filters for a specific category
 */
export function getFiltersForCategory(categorySlug: string): FilterGroup[] {
  const slug = categorySlug.toLowerCase();

  // Check direct match
  if (CATEGORY_FILTER_MAP[slug]) {
    return CATEGORY_FILTER_MAP[slug];
  }

  // Check partial match
  for (const [key, filters] of Object.entries(CATEGORY_FILTER_MAP)) {
    if (slug.includes(key) || key.includes(slug)) {
      return filters;
    }
  }

  return DEFAULT_FILTERS;
}

/**
 * Parse filter values from URL search params
 */
export function parseFilterParams(searchParams: URLSearchParams): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  searchParams.forEach((value, key) => {
    // Skip non-filter params
    if (['page', 'limit', 'search', 'sort', 'category', 'brand', 'minPrice', 'maxPrice', 'featured'].includes(key)) {
      return;
    }

    filters[key] = value.split(',').filter(Boolean);
  });

  return filters;
}

/**
 * Build URL search params from filter selections
 */
export function buildFilterParams(filters: Record<string, string[]>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, values]) => {
    if (values.length > 0) {
      params.set(key, values.join(','));
    }
  });

  return params;
}
