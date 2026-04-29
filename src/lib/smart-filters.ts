// Shared smart filter patterns and cascading logic for category/brand pages

export const SMART_FILTER_PATTERNS: Record<string, { keywords: Record<string, string>; label: string }> = {
  gender: {
    keywords: {
      "men's": "Male", "mens": "Male", "men": "Male", "male": "Male", "man": "Male",
      "for men": "Male", "gentleman": "Male", "gentlemen": "Male", "boys": "Male", "boy's": "Male", " m ": "Male",
      "women's": "Female", "womens": "Female", "women": "Female", "woman": "Female", "ladies": "Female",
      "lady": "Female", "female": "Female", "for women": "Female", "girl": "Female", "girls": "Female",
      " f ": "Female", "feminine": "Female",
      "unisex": "Unisex", "uni-sex": "Unisex", "universal": "Unisex", "all gender": "Unisex",
    },
    label: 'Gender',
  },
  toeType: {
    keywords: {
      'steel toe': 'Steel Toe', 'soft toe': 'Soft Toe', 'casual': 'Soft Toe / Casual',
      'composite toe': 'Composite Toe', 'safety toe': 'Safety Toe', 'alloy toe': 'Alloy Toe', 'carbon toe': 'Carbon Toe',
    },
    label: 'Toe Type',
  },
  material: {
    keywords: {
      'leather': 'Leather', 'rubber': 'Rubber', 'synthetic': 'Synthetic', 'nylon': 'Nylon',
      'polyester': 'Polyester', 'cotton': 'Cotton', 'kevlar': 'Kevlar', 'neoprene': 'Neoprene',
      'latex': 'Latex', 'nitrile': 'Nitrile', 'vinyl': 'Vinyl', 'fleece': 'Fleece', 'mesh': 'Mesh', 'tricot': 'Tricot / Solid',
    },
    label: 'Material',
  },
  size: {
    keywords: {
      'small': 'Small', 'medium': 'Medium', 'large': 'Large', 'xl': 'XL',
      'xxl': 'XXL', 'xxxl': 'XXXL', 'one size': 'One Size',
    },
    label: 'Size',
  },
  color: {
    keywords: {
      'black': 'Black', 'white': 'White', 'red': 'Red', 'blue': 'Blue', 'green': 'Green',
      'yellow': 'Yellow', 'orange': 'Orange', 'brown': 'Brown', 'gray': 'Gray', 'grey': 'Gray',
      'navy': 'Navy', 'pink': 'Pink', 'hi-vis': 'Hi-Vis', 'hi vis': 'Hi-Vis',
      'high visibility': 'Hi-Vis', 'multi color': 'Multi Color', 'multicolor': 'Multi Color',
    },
    label: 'Color',
  },
  protection: {
    keywords: {
      'waterproof': 'Waterproof', 'water resistant': 'Water Resistant', 'fire resistant': 'Fire Resistant',
      'fire retardant': 'Fire Retardant', 'fr': 'Fire Resistant', 'flame resistant': 'Fire Resistant',
      'cut resistant': 'Cut Resistant', 'puncture resistant': 'Puncture Resistant',
      'slip resistant': 'Slip Resistant', 'non-slip': 'Slip Resistant', 'anti-slip': 'Slip Resistant',
      'insulated': 'Insulated', 'thermal': 'Thermal', 'anti-static': 'Anti-Static',
      'anti static': 'Anti-Static', 'uv protection': 'UV Protection',
      'bug repellant': 'Bug Repellant', 'bug repellent': 'Bug Repellant',
    },
    label: 'Protection',
  },
  style: {
    keywords: {
      'boot': 'Boot', 'shoe': 'Shoe', 'sneaker': 'Sneaker', 'loafer': 'Loafer', 'oxford': 'Oxford',
      'hiker': 'Hiker', 'athletic': 'Athletic', 'work boot': 'Work Boot',
      '6 inch': '6 Inch', '6"': '6 Inch', '8 inch': '8 Inch', '8"': '8 Inch',
      'tactical': 'Tactical', 'wellington': 'Wellington', 'gum': 'Gum / Wellington',
      'windbreaker': 'Windbreaker', 'parka': 'Full Length / Parka', 'bomber': 'Bomber Style',
      'long sleeve': 'Long Sleeve', 'short sleeve': 'Short Sleeve', 'zipper': 'Zipper',
      'velcro': 'Velcro', 'breakaway': 'Breakaway',
    },
    label: 'Style',
  },
  type: {
    keywords: {
      'ansi class 2': 'ANSI Class 2', 'class 2': 'ANSI Class 2', 'ansi class 3': 'ANSI Class 3',
      'class 3': 'ANSI Class 3', 'non ansi': 'Non ANSI', 'non-ansi': 'Non ANSI', 'incident command': 'Incident Command',
    },
    label: 'Type',
  },
  footwearSize: {
    keywords: {
      'size 4': '4', 'size 5': '5', 'size 6': '6', 'size 7': '7', 'size 8': '8',
      'size 9': '9', 'size 10': '10', 'size 11': '11', 'size 12': '12', 'size 13': '13', 'size 14': '14', 'size 15': '15',
      'size 4.5': '4.5', 'size 5.5': '5.5', 'size 6.5': '6.5', 'size 7.5': '7.5', 'size 8.5': '8.5',
      'size 9.5': '9.5', 'size 10.5': '10.5', 'size 11.5': '11.5', 'size 12.5': '12.5', 'size 13.5': '13.5',
      ' 4 ': '4', ' 5 ': '5', ' 6 ': '6', ' 7 ': '7', ' 8 ': '8', ' 9 ': '9', ' 10 ': '10',
      ' 11 ': '11', ' 12 ': '12', ' 13 ': '13', ' 14 ': '14', ' 15 ': '15',
      'wide': 'Wide', 'extra wide': 'Extra Wide', '2e': 'Wide (2E)', '4e': 'Extra Wide (4E)', 'eee': 'Extra Wide',
    },
    label: 'Shoe Size',
  },
  nrr: {
    keywords: {
      'nrr 19': 'NRR 19', 'nrr 20': 'NRR 20', 'nrr 21': 'NRR 21', 'nrr 22': 'NRR 22', 'nrr 23': 'NRR 23',
      'nrr 24': 'NRR 24', 'nrr 25': 'NRR 25', 'nrr 26': 'NRR 26', 'nrr 27': 'NRR 27', 'nrr 28': 'NRR 28',
      'nrr 29': 'NRR 29', 'nrr 30': 'NRR 30', 'nrr 31': 'NRR 31', 'nrr 32': 'NRR 32', 'nrr 33': 'NRR 33',
    },
    label: 'NRR (Noise Reduction Rating)',
  },
  protectionType: {
    keywords: {
      'impact': 'Impact', 'splash': 'Splash', 'dust': 'Dust', 'chemical': 'Chemical', 'uv': 'UV Protection', 'laser': 'Laser', 'welding': 'Welding',
    },
    label: 'Protection Type',
  },
  antiFog: { keywords: { 'anti-fog': 'Anti-Fog', 'anti fog': 'Anti-Fog', 'antifog': 'Anti-Fog', 'fog free': 'Anti-Fog' }, label: 'Anti-Fog' },
  antiScratch: { keywords: { 'anti-scratch': 'Anti-Scratch', 'anti scratch': 'Anti-Scratch', 'scratch resistant': 'Anti-Scratch', 'scratch-resistant': 'Anti-Scratch', 'hard coat': 'Anti-Scratch' }, label: 'Anti-Scratch' },
  eyewearStyle: {
    keywords: {
      'frameless': 'Frameless', 'full frame': 'Full Frame', 'full-frame': 'Full Frame', 'half frame': 'Half Frame', 'half-frame': 'Half Frame',
      'rimless': 'Rimless', 'otg': 'OTG (Over The Glass)', 'over the glass': 'OTG (Over The Glass)', 'over-the-glass': 'OTG (Over The Glass)',
      'fit over': 'OTG (Over The Glass)', 'goggle': 'Goggle', 'goggles': 'Goggle', 'wrap': 'Wraparound', 'wraparound': 'Wraparound', 'wrap-around': 'Wraparound',
    },
    label: 'Eyewear Style',
  },
  hardHatType: {
    keywords: {
      'full brim': 'Full Brim', 'full-brim': 'Full Brim', 'cap style': 'Cap Style', 'cap-style': 'Cap Style',
      'vented': 'Vented', 'non-vented': 'Non-Vented', 'non vented': 'Non-Vented', 'unvented': 'Non-Vented',
      'type i': 'Type I', 'type ii': 'Type II', 'type 1': 'Type I', 'type 2': 'Type II',
    },
    label: 'Hard Hat Type',
  },
  hiVisStyle: {
    keywords: {
      'zipper': 'Zipper Closure', 'zipper closure': 'Zipper Closure', 'velcro': 'Velcro Closure', 'velcro closure': 'Velcro Closure',
      'hook and loop': 'Velcro Closure', 'breakaway': 'Breakaway', 'break-away': 'Breakaway', 'incident command': 'Incident Command',
      'incident': 'Incident Command', 'public safety': 'Public Safety', 'surveyor': 'Surveyor', 'bomber': 'Bomber Style',
      'bomber style': 'Bomber Style', 'parka': 'Parka Style', 'parka style': 'Parka Style', 'windbreaker': 'Windbreaker',
      'long sleeve': 'Long Sleeve', 'long-sleeve': 'Long Sleeve', 'short sleeve': 'Short Sleeve', 'short-sleeve': 'Short Sleeve',
      'button down': 'Button Down', 'button-down': 'Button Down',
    },
    label: 'Style',
  },
  hiVisType: {
    keywords: {
      'ansi class 2': 'ANSI Class 2', 'class 2': 'ANSI Class 2', 'class ii': 'ANSI Class 2',
      'ansi class 3': 'ANSI Class 3', 'class 3': 'ANSI Class 3', 'class iii': 'ANSI Class 3',
      'non ansi': 'Non-ANSI', 'non-ansi': 'Non-ANSI', 'nonansi': 'Non-ANSI',
    },
    label: 'Type',
  },
  hiVisMaterial: {
    keywords: {
      'polyester mesh': 'Polyester Mesh', 'mesh': 'Polyester Mesh', 'polyester tricot': 'Polyester Tricot/Solid',
      'tricot': 'Polyester Tricot/Solid', 'solid': 'Polyester Tricot/Solid', 'cotton': 'Cotton',
      '100% cotton': 'Cotton', 'polyester': 'Polyester', '100% polyester': 'Polyester',
    },
    label: 'Material',
  },
  hiVisSize: {
    keywords: {
      'small': 'S', 'medium': 'M', 'large': 'L', ' s ': 'S', ' m ': 'M', ' l ': 'L',
      'xl': 'XL', '2xl': '2X', '2x': '2X', 'xxl': '2X', '3xl': '3X', '3x': '3X', 'xxxl': '3X',
      '4xl': '4X', '4x': '4X', '5xl': '5X', '5x': '5X',
    },
    label: 'Size',
  },
  hiVisColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange', 'hi-vis orange': 'Hi-Vis Orange', 'high vis orange': 'Hi-Vis Orange',
      'high-vis orange': 'Hi-Vis Orange', 'safety orange': 'Hi-Vis Orange', 'fluorescent orange': 'Hi-Vis Orange',
      'hi vis yellow': 'Hi-Vis Yellow', 'hi-vis yellow': 'Hi-Vis Yellow', 'high vis yellow': 'Hi-Vis Yellow',
      'high-vis yellow': 'Hi-Vis Yellow', 'safety yellow': 'Hi-Vis Yellow', 'fluorescent yellow': 'Hi-Vis Yellow',
      'lime': 'Hi-Vis Yellow', 'lime green': 'Hi-Vis Yellow', 'black': 'Black',
    },
    label: 'Color',
  },
  hiVisProtection: {
    keywords: {
      'fire resistant': 'Fire Resistant', 'fire-resistant': 'Fire Resistant', 'flame resistant': 'Fire Resistant',
      'fr ': 'Fire Resistant', 'water resistant': 'Water Resistant', 'water-resistant': 'Water Resistant',
      'waterproof': 'Waterproof', 'water proof': 'Waterproof', 'insulated': 'Insulated', 'thermal': 'Thermal',
    },
    label: 'Protection',
  },
  taaCompliance: {
    keywords: {
      'taa': 'TAA Compliant', 'taa compliant': 'TAA Compliant', 'taa-compliant': 'TAA Compliant',
      'trade agreements act': 'TAA Compliant', 'baa': 'BAA Compliant', 'baa compliant': 'BAA Compliant',
      'baa-compliant': 'BAA Compliant', 'buy american': 'BAA Compliant', 'buy american act': 'BAA Compliant',
      'made in usa': 'Made in USA', 'made in america': 'Made in USA', 'american made': 'Made in USA',
      'government compliant': 'Government Compliant',
    },
    label: 'TAA/BAA Approved',
  },
  ansiClass: {
    keywords: {
      'ansi class 2': 'ANSI Class 2', 'class 2': 'ANSI Class 2', 'class ii': 'ANSI Class 2',
      'ansi class 3': 'ANSI Class 3', 'class 3': 'ANSI Class 3', 'class iii': 'ANSI Class 3',
      'non ansi': 'Non-ANSI', 'non-ansi': 'Non-ANSI', 'nonansi': 'Non-ANSI',
    },
    label: 'ANSI Class',
  },
  sweatshirtStyle: {
    keywords: {
      'pullover crew': 'Pullover Crew Neck', 'crew neck': 'Pullover Crew Neck', 'crewneck': 'Pullover Crew Neck',
      'pullover hooded': 'Pullover Hooded Sweatshirt', 'hooded sweatshirt': 'Pullover Hooded Sweatshirt',
      'hoodie': 'Pullover Hooded Sweatshirt', 'pullover hoodie': 'Pullover Hooded Sweatshirt',
      'zipper hooded': 'Zipper Hooded Sweatshirt', 'zip hooded': 'Zipper Hooded Sweatshirt',
      'zip hoodie': 'Zipper Hooded Sweatshirt', 'zip-up hoodie': 'Zipper Hooded Sweatshirt',
      'full zip': 'Zipper Hooded Sweatshirt', 'full-zip': 'Zipper Hooded Sweatshirt',
    },
    label: 'Style',
  },
  trouserStyle: {
    keywords: {
      'polyester mesh': 'Polyester Mesh', 'mesh pant': 'Polyester Mesh', 'polyester tricot': 'Polyester Tricot',
      'tricot pant': 'Polyester Tricot', 'waterproof bib': 'Waterproof Bib', 'bib overall': 'Waterproof Bib',
      'waterproof pant': 'Waterproof', 'waterproof': 'Waterproof', 'breathable': 'Breathable', 'breathable pant': 'Breathable',
    },
    label: 'Style',
  },
  trouserType: { keywords: { 'class e': 'Class E', 'class-e': 'Class E', 'ansi class e': 'Class E' }, label: 'Type' },
  extendedHiVisColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange', 'hi-vis orange': 'Hi-Vis Orange', 'high vis orange': 'Hi-Vis Orange',
      'safety orange': 'Hi-Vis Orange', 'fluorescent orange': 'Hi-Vis Orange',
      'hi vis yellow': 'Hi-Vis Yellow', 'hi-vis yellow': 'Hi-Vis Yellow', 'high vis yellow': 'Hi-Vis Yellow',
      'safety yellow': 'Hi-Vis Yellow', 'fluorescent yellow': 'Hi-Vis Yellow', 'lime': 'Hi-Vis Yellow', 'lime green': 'Hi-Vis Yellow',
      'black': 'Black', 'navy': 'Navy', 'navy blue': 'Navy', 'red': 'Red', 'green': 'Green', 'blue': 'Blue', 'yellow': 'Yellow', 'orange': 'Orange',
    },
    label: 'Color',
  },
  rainGearStyle: {
    keywords: {
      'rain jacket': 'Rain Jacket', 'rain coat': 'Rain Jacket', 'raincoat': 'Rain Jacket',
      'rain pant': 'Rain Pant', 'rain pants': 'Rain Pant', 'coverall': 'Coverall', 'coveralls': 'Coverall',
      'bib': 'Bib', 'bib overall': 'Bib', 'rain suit': 'Raingear Set (Pant & Jacket)',
      'rain set': 'Raingear Set (Pant & Jacket)', 'raingear set': 'Raingear Set (Pant & Jacket)',
      '2 piece': 'Raingear Set (Pant & Jacket)', '2-piece': 'Raingear Set (Pant & Jacket)',
    },
    label: 'Style',
  },
  hiVisAccessoryStyle: {
    keywords: {
      'gaiter': 'Gaiters', 'gaiters': 'Gaiters', 'leg gaiter': 'Gaiters',
      'sash': 'Sash Belt', 'sash belt': 'Sash Belt', 'safety sash': 'Sash Belt',
      'seatbelt cover': 'Seatbelt Cover', 'seat belt cover': 'Seatbelt Cover', 'seatbelt': 'Seatbelt Cover',
    },
    label: 'Style',
  },
  hiVisAccessoryColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange', 'hi-vis orange': 'Hi-Vis Orange', 'safety orange': 'Hi-Vis Orange',
      'fluorescent orange': 'Hi-Vis Orange', 'hi vis yellow': 'Hi-Vis Yellow', 'hi-vis yellow': 'Hi-Vis Yellow',
      'safety yellow': 'Hi-Vis Yellow', 'fluorescent yellow': 'Hi-Vis Yellow', 'lime': 'Hi-Vis Yellow',
    },
    label: 'Color',
  },
  lensColor: {
    keywords: {
      'clear': 'Clear', 'clear lens': 'Clear', 'smoke': 'Smoke', 'smoked': 'Smoke', 'gray': 'Gray', 'grey': 'Gray',
      'amber': 'Amber', 'yellow': 'Yellow', 'blue': 'Blue', 'blue mirror': 'Blue Mirror', 'silver mirror': 'Silver Mirror',
      'mirror': 'Mirror', 'indoor/outdoor': 'Indoor/Outdoor', 'indoor outdoor': 'Indoor/Outdoor', 'i/o': 'Indoor/Outdoor',
      'photochromic': 'Photochromic', 'transition': 'Photochromic',
    },
    label: 'Lens Color',
  },
  eyewearProtection: {
    keywords: {
      'anti-fog': 'Anti-Fog', 'anti fog': 'Anti-Fog', 'antifog': 'Anti-Fog', 'fog free': 'Anti-Fog',
      'anti-scratch': 'Anti-Scratch', 'anti scratch': 'Anti-Scratch', 'scratch resistant': 'Anti-Scratch',
      'hard coat': 'Anti-Scratch', 'welding': 'Welding', 'weld': 'Welding',
    },
    label: 'Protection',
  },
  eyewearProduct: {
    keywords: {
      'dispenser': 'Eyewear Dispenser', 'eyewear dispenser': 'Eyewear Dispenser', 'glasses dispenser': 'Eyewear Dispenser',
      'lens cleaning': 'Lens Cleaning Dispenser', 'lens cleaner': 'Lens Cleaning Dispenser', 'cleaning dispenser': 'Lens Cleaning Dispenser',
      'cleaning station': 'Cleaning Stations', 'cleaning stations': 'Cleaning Stations',
      'lanyard': 'Lanyards', 'lanyards': 'Lanyards', 'cord': 'Lanyards', 'retainer': 'Lanyards',
      'face shield': 'Face Shields', 'face shields': 'Face Shields', 'faceshield': 'Face Shields',
      'side shield': 'Side Shields', 'side shields': 'Side Shields', 'sideshield': 'Side Shields',
    },
    label: 'Product',
  },
  bibsProtection: { keywords: { 'insulated': 'Insulated / Cold Weather', 'cold weather': 'Insulated / Cold Weather', 'thermal': 'Insulated / Cold Weather', 'winter': 'Insulated / Cold Weather' }, label: 'Protection' },
  trouserProtection: {
    keywords: {
      'fire resistant': 'Fire Resistant', 'fire-resistant': 'Fire Resistant', 'flame resistant': 'Fire Resistant',
      'fr ': 'Fire Resistant', 'water resistant': 'Water Resistant', 'water-resistant': 'Water Resistant',
      'waterproof': 'Waterproof', 'ripstop': 'Ripstop', 'rip-stop': 'Ripstop', 'rip stop': 'Ripstop',
    },
    label: 'Protection',
  },
};

export const CLOTHING_SIZE_ORDER: Record<string, number> = {
  'S': 1, 'M': 2, 'L': 3, 'XL': 4,
  '2X': 5, '2XL': 5, 'XXL': 5,
  '3X': 6, '3XL': 6, 'XXXL': 6,
  '4X': 7, '4XL': 7,
  '5X': 8, '5XL': 8,
};

export const FOOTWEAR_SIZE_ORDER: Record<string, number> = {
  '4': 1, '4.5': 2, '5': 3, '5.5': 4, '6': 5, '6.5': 6,
  '7': 7, '7.5': 8, '8': 9, '8.5': 10, '9': 11, '9.5': 12,
  '10': 13, '10.5': 14, '11': 15, '11.5': 16, '12': 17, '12.5': 18,
  '13': 19, '13.5': 20, '14': 21, '15': 22,
  'Wide': 100, 'Wide (2E)': 101, 'Extra Wide': 102, 'Extra Wide (4E)': 103,
};

export function sortSizes(values: string[], filterKey: string): string[] {
  if (filterKey === 'hiVisSize' || filterKey === 'size') {
    return values.sort((a, b) => (CLOTHING_SIZE_ORDER[a] ?? 99) - (CLOTHING_SIZE_ORDER[b] ?? 99));
  }
  if (filterKey === 'footwearSize') {
    return values.sort((a, b) => (FOOTWEAR_SIZE_ORDER[a] ?? 99) - (FOOTWEAR_SIZE_ORDER[b] ?? 99));
  }
  return values.sort();
}

export const GENDER_EXCLUSIONS: Record<string, string[]> = {
  'Male': ['women', 'woman', 'ladies', 'lady', 'female', 'girl', 'feminine'],
  'Female': [],
  'Unisex': [],
};

// Build Prisma WHERE conditions for smart filters
export function buildSmartFilterWhere(smartFilters: Record<string, string[]>): any[] {
  const filterConditions: any[] = [];

  for (const [filterKey, values] of Object.entries(smartFilters)) {
    if (!values || values.length === 0) continue;
    const pattern = SMART_FILTER_PATTERNS[filterKey];
    const keywordConditions: any[] = [];

    for (const displayValue of values) {
      const keywords = pattern
        ? Object.entries(pattern.keywords).filter(([, n]) => n === displayValue).map(([k]) => k)
        : [displayValue];
      for (const keyword of keywords) {
        keywordConditions.push(
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        );
      }
    }

    if (keywordConditions.length === 0) continue;

    if (filterKey === 'gender' && values.length === 1 && GENDER_EXCLUSIONS[values[0]]?.length > 0) {
      const notConditions = GENDER_EXCLUSIONS[values[0]].map(word => ({
        name: { not: { contains: word }, mode: 'insensitive' as const },
      }));
      filterConditions.push({ AND: [{ OR: keywordConditions }, ...notConditions] });
    } else {
      filterConditions.push({ OR: keywordConditions });
    }
  }

  return filterConditions;
}

// Check if a product text matches a single smart filter group (JS-side for cascading)
function productTextMatchesFilterValue(text: string, filterKey: string, displayValue: string): boolean {
  const pattern = SMART_FILTER_PATTERNS[filterKey];
  if (!pattern) return text.includes(displayValue.toLowerCase());

  const keywords = Object.entries(pattern.keywords)
    .filter(([, n]) => n === displayValue)
    .map(([k]) => k);

  if (!keywords.some(k => text.includes(k.toLowerCase()))) return false;

  // Apply gender exclusions
  if (filterKey === 'gender' && GENDER_EXCLUSIONS[displayValue]?.length > 0) {
    if (GENDER_EXCLUSIONS[displayValue].some(excl => text.includes(excl.toLowerCase()))) return false;
  }

  return true;
}

// Check if a product matches ALL values in a filter group (OR within group = any match counts)
export function productMatchesFilterGroup(
  text: string,
  filterKey: string,
  values: string[],
): boolean {
  return values.some(v => productTextMatchesFilterValue(text, filterKey, v));
}

type ProductForFilter = { name: string; description: string | null };

// Extract smart filter values from a subset of products
export function extractSmartFilters(
  products: ProductForFilter[],
  config: { include?: string[]; exclude?: string[] } | null,
): Record<string, string[]> {
  const effectiveConfig = config || { include: ['gender', 'material', 'size', 'color', 'protection', 'style', 'type'] };
  let filterKeys = Object.keys(SMART_FILTER_PATTERNS);

  if (effectiveConfig.include) {
    filterKeys = effectiveConfig.include.filter(k => SMART_FILTER_PATTERNS[k]);
  }
  if (effectiveConfig.exclude) {
    filterKeys = filterKeys.filter(k => !effectiveConfig.exclude!.includes(k));
  }

  const filters: Record<string, Set<string>> = {};

  for (const product of products) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();
    for (const key of filterKeys) {
      const pattern = SMART_FILTER_PATTERNS[key];
      if (!pattern) continue;
      if (!filters[key]) filters[key] = new Set();
      for (const [searchTerm, displayName] of Object.entries(pattern.keywords)) {
        if (text.includes(searchTerm.toLowerCase())) filters[key].add(displayName);
      }
    }
  }

  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(filters)) {
    if (values.size > 0) result[key] = sortSizes(Array.from(values), key);
  }
  return result;
}

// Compute cascading facets: for each filter group, compute available options
// by applying all OTHER active smart filters but NOT the current group's filter.
export function computeCascadingSmartFilters(
  allProducts: ProductForFilter[],
  activeSmartFilters: Record<string, string[]>,
  config: { include?: string[]; exclude?: string[] } | null,
): Record<string, string[]> {
  const effectiveConfig = config || { include: ['gender', 'material', 'size', 'color', 'protection', 'style', 'type'] };
  let filterKeys = Object.keys(SMART_FILTER_PATTERNS);

  if (effectiveConfig.include) {
    filterKeys = effectiveConfig.include.filter(k => SMART_FILTER_PATTERNS[k]);
  }
  if (effectiveConfig.exclude) {
    filterKeys = filterKeys.filter(k => !effectiveConfig.exclude!.includes(k));
  }

  const result: Record<string, string[]> = {};

  for (const currentKey of filterKeys) {
    const pattern = SMART_FILTER_PATTERNS[currentKey];
    if (!pattern) continue;

    // Filter products using all active smart filters EXCEPT currentKey
    const otherActiveFilters = Object.entries(activeSmartFilters)
      .filter(([k, v]) => k !== currentKey && v.length > 0);

    const eligibleProducts = allProducts.filter(product => {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      return otherActiveFilters.every(([k, values]) => productMatchesFilterGroup(text, k, values));
    });

    // Extract values for currentKey from eligible products
    const values = new Set<string>();
    for (const product of eligibleProducts) {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      for (const [searchTerm, displayName] of Object.entries(pattern.keywords)) {
        if (text.includes(searchTerm.toLowerCase())) values.add(displayName);
      }
    }

    if (values.size > 0) {
      result[currentKey] = sortSizes(Array.from(values), currentKey);
    }
  }

  return result;
}
