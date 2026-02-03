import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Custom size ordering for clothing (S to 5X)
const CLOTHING_SIZE_ORDER: Record<string, number> = {
  'S': 1, 'M': 2, 'L': 3, 'XL': 4,
  '2X': 5, '2XL': 5, 'XXL': 5,
  '3X': 6, '3XL': 6, 'XXXL': 6,
  '4X': 7, '4XL': 7,
  '5X': 8, '5XL': 8,
};

// Custom size ordering for footwear (numeric)
const FOOTWEAR_SIZE_ORDER: Record<string, number> = {
  '4': 1, '4.5': 2, '5': 3, '5.5': 4, '6': 5, '6.5': 6,
  '7': 7, '7.5': 8, '8': 9, '8.5': 10, '9': 11, '9.5': 12,
  '10': 13, '10.5': 14, '11': 15, '11.5': 16, '12': 17, '12.5': 18,
  '13': 19, '13.5': 20, '14': 21, '15': 22,
  'Wide': 100, 'Wide (2E)': 101, 'Extra Wide': 102, 'Extra Wide (4E)': 103,
};

// Sort function for sizes
function sortSizes(values: string[], filterKey: string): string[] {
  if (filterKey === 'hiVisSize' || filterKey === 'size') {
    return values.sort((a, b) => {
      const orderA = CLOTHING_SIZE_ORDER[a] ?? 99;
      const orderB = CLOTHING_SIZE_ORDER[b] ?? 99;
      return orderA - orderB;
    });
  }
  if (filterKey === 'footwearSize') {
    return values.sort((a, b) => {
      const orderA = FOOTWEAR_SIZE_ORDER[a] ?? 99;
      const orderB = FOOTWEAR_SIZE_ORDER[b] ?? 99;
      return orderA - orderB;
    });
  }
  // Default alphabetical sort
  return values.sort();
}

// Smart filter keywords - these are extracted from product names/descriptions
// Keywords map to their normalized display value
const SMART_FILTER_PATTERNS: Record<string, { keywords: Record<string, string>; label: string }> = {
  gender: {
    keywords: {
      // Male variations
      "men's": "Male",
      "mens": "Male",
      "men": "Male",
      "male": "Male",
      "man": "Male",
      "for men": "Male",
      "gentleman": "Male",
      "gentlemen": "Male",
      "boys": "Male",
      "boy's": "Male",
      " m ": "Male",
      // Female variations
      "women's": "Female",
      "womens": "Female",
      "women": "Female",
      "woman": "Female",
      "ladies": "Female",
      "lady": "Female",
      "female": "Female",
      "for women": "Female",
      "girl": "Female",
      "girls": "Female",
      " f ": "Female",
      "feminine": "Female",
      // Unisex variations
      "unisex": "Unisex",
      "uni-sex": "Unisex",
      "universal": "Unisex",
      "all gender": "Unisex",
    },
    label: 'Gender',
  },
  toeType: {
    keywords: {
      'steel toe': 'Steel Toe',
      'soft toe': 'Soft Toe',
      'casual': 'Soft Toe / Casual',
      'composite toe': 'Composite Toe',
      'safety toe': 'Safety Toe',
      'alloy toe': 'Alloy Toe',
      'carbon toe': 'Carbon Toe',
    },
    label: 'Toe Type',
  },
  material: {
    keywords: {
      'leather': 'Leather',
      'rubber': 'Rubber',
      'synthetic': 'Synthetic',
      'nylon': 'Nylon',
      'polyester': 'Polyester',
      'cotton': 'Cotton',
      'kevlar': 'Kevlar',
      'neoprene': 'Neoprene',
      'latex': 'Latex',
      'nitrile': 'Nitrile',
      'vinyl': 'Vinyl',
      'fleece': 'Fleece',
      'mesh': 'Mesh',
      'tricot': 'Tricot / Solid',
    },
    label: 'Material',
  },
  size: {
    keywords: {
      'small': 'Small',
      'medium': 'Medium',
      'large': 'Large',
      'xl': 'XL',
      'xxl': 'XXL',
      'xxxl': 'XXXL',
      'one size': 'One Size',
    },
    label: 'Size',
  },
  color: {
    keywords: {
      'black': 'Black',
      'white': 'White',
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'yellow': 'Yellow',
      'orange': 'Orange',
      'brown': 'Brown',
      'gray': 'Gray',
      'grey': 'Gray',
      'navy': 'Navy',
      'pink': 'Pink',
      'hi-vis': 'Hi-Vis',
      'hi vis': 'Hi-Vis',
      'high visibility': 'Hi-Vis',
      'multi color': 'Multi Color',
      'multicolor': 'Multi Color',
    },
    label: 'Color',
  },
  protection: {
    keywords: {
      'waterproof': 'Waterproof',
      'water resistant': 'Water Resistant',
      'fire resistant': 'Fire Resistant',
      'fire retardant': 'Fire Retardant',
      'fr': 'Fire Resistant',
      'flame resistant': 'Fire Resistant',
      'cut resistant': 'Cut Resistant',
      'puncture resistant': 'Puncture Resistant',
      'slip resistant': 'Slip Resistant',
      'non-slip': 'Slip Resistant',
      'anti-slip': 'Slip Resistant',
      'insulated': 'Insulated',
      'thermal': 'Thermal',
      'anti-static': 'Anti-Static',
      'anti static': 'Anti-Static',
      'uv protection': 'UV Protection',
      'bug repellant': 'Bug Repellant',
      'bug repellent': 'Bug Repellant',
    },
    label: 'Protection',
  },
  style: {
    keywords: {
      'boot': 'Boot',
      'shoe': 'Shoe',
      'sneaker': 'Sneaker',
      'loafer': 'Loafer',
      'oxford': 'Oxford',
      'hiker': 'Hiker',
      'athletic': 'Athletic',
      'work boot': 'Work Boot',
      '6 inch': '6 Inch',
      '6"': '6 Inch',
      '8 inch': '8 Inch',
      '8"': '8 Inch',
      'tactical': 'Tactical',
      'wellington': 'Wellington',
      'gum': 'Gum / Wellington',
      'windbreaker': 'Windbreaker',
      'parka': 'Full Length / Parka',
      'bomber': 'Bomber Style',
      'long sleeve': 'Long Sleeve',
      'short sleeve': 'Short Sleeve',
      'zipper': 'Zipper',
      'velcro': 'Velcro',
      'breakaway': 'Breakaway',
    },
    label: 'Style',
  },
  // Footwear-specific numeric sizes
  footwearSize: {
    keywords: {
      // Full sizes
      'size 4': '4',
      'size 5': '5',
      'size 6': '6',
      'size 7': '7',
      'size 8': '8',
      'size 9': '9',
      'size 10': '10',
      'size 11': '11',
      'size 12': '12',
      'size 13': '13',
      'size 14': '14',
      'size 15': '15',
      // Half sizes
      'size 4.5': '4.5',
      'size 5.5': '5.5',
      'size 6.5': '6.5',
      'size 7.5': '7.5',
      'size 8.5': '8.5',
      'size 9.5': '9.5',
      'size 10.5': '10.5',
      'size 11.5': '11.5',
      'size 12.5': '12.5',
      'size 13.5': '13.5',
      // Without "size" prefix (with spaces to avoid false matches)
      ' 4 ': '4',
      ' 5 ': '5',
      ' 6 ': '6',
      ' 7 ': '7',
      ' 8 ': '8',
      ' 9 ': '9',
      ' 10 ': '10',
      ' 11 ': '11',
      ' 12 ': '12',
      ' 13 ': '13',
      ' 14 ': '14',
      ' 15 ': '15',
      // Wide widths
      'wide': 'Wide',
      'extra wide': 'Extra Wide',
      '2e': 'Wide (2E)',
      '4e': 'Extra Wide (4E)',
      'eee': 'Extra Wide',
    },
    label: 'Shoe Size',
  },
  type: {
    keywords: {
      'ansi class 2': 'ANSI Class 2',
      'class 2': 'ANSI Class 2',
      'ansi class 3': 'ANSI Class 3',
      'class 3': 'ANSI Class 3',
      'non ansi': 'Non ANSI',
      'non-ansi': 'Non ANSI',
      'incident command': 'Incident Command',
    },
    label: 'Type',
  },
  // New filters for specific categories
  nrr: {
    keywords: {
      'nrr 19': 'NRR 19',
      'nrr 20': 'NRR 20',
      'nrr 21': 'NRR 21',
      'nrr 22': 'NRR 22',
      'nrr 23': 'NRR 23',
      'nrr 24': 'NRR 24',
      'nrr 25': 'NRR 25',
      'nrr 26': 'NRR 26',
      'nrr 27': 'NRR 27',
      'nrr 28': 'NRR 28',
      'nrr 29': 'NRR 29',
      'nrr 30': 'NRR 30',
      'nrr 31': 'NRR 31',
      'nrr 32': 'NRR 32',
      'nrr 33': 'NRR 33',
      '19db': 'NRR 19',
      '20db': 'NRR 20',
      '21db': 'NRR 21',
      '22db': 'NRR 22',
      '23db': 'NRR 23',
      '24db': 'NRR 24',
      '25db': 'NRR 25',
      '26db': 'NRR 26',
      '27db': 'NRR 27',
      '28db': 'NRR 28',
      '29db': 'NRR 29',
      '30db': 'NRR 30',
      '31db': 'NRR 31',
      '32db': 'NRR 32',
      '33db': 'NRR 33',
    },
    label: 'NRR (Noise Reduction Rating)',
  },
  protectionType: {
    keywords: {
      'impact': 'Impact',
      'splash': 'Splash',
      'dust': 'Dust',
      'chemical': 'Chemical',
      'uv': 'UV Protection',
      'laser': 'Laser',
      'welding': 'Welding',
    },
    label: 'Protection Type',
  },
  antiFog: {
    keywords: {
      'anti-fog': 'Anti-Fog',
      'anti fog': 'Anti-Fog',
      'antifog': 'Anti-Fog',
      'fog free': 'Anti-Fog',
    },
    label: 'Anti-Fog',
  },
  antiScratch: {
    keywords: {
      'anti-scratch': 'Anti-Scratch',
      'anti scratch': 'Anti-Scratch',
      'scratch resistant': 'Anti-Scratch',
      'scratch-resistant': 'Anti-Scratch',
      'hard coat': 'Anti-Scratch',
    },
    label: 'Anti-Scratch',
  },
  eyewearStyle: {
    keywords: {
      'frameless': 'Frameless',
      'full frame': 'Full Frame',
      'full-frame': 'Full Frame',
      'half frame': 'Half Frame',
      'half-frame': 'Half Frame',
      'rimless': 'Rimless',
      'otg': 'OTG (Over The Glass)',
      'over the glass': 'OTG (Over The Glass)',
      'over-the-glass': 'OTG (Over The Glass)',
      'fit over': 'OTG (Over The Glass)',
      'goggle': 'Goggle',
      'goggles': 'Goggle',
      'wrap': 'Wraparound',
      'wraparound': 'Wraparound',
      'wrap-around': 'Wraparound',
    },
    label: 'Eyewear Style',
  },
  hardHatType: {
    keywords: {
      'full brim': 'Full Brim',
      'full-brim': 'Full Brim',
      'cap style': 'Cap Style',
      'cap-style': 'Cap Style',
      'vented': 'Vented',
      'non-vented': 'Non-Vented',
      'non vented': 'Non-Vented',
      'unvented': 'Non-Vented',
      'type i': 'Type I',
      'type ii': 'Type II',
      'type 1': 'Type I',
      'type 2': 'Type II',
    },
    label: 'Hard Hat Type',
  },
  // High Visibility specific filters
  hiVisStyle: {
    keywords: {
      'zipper': 'Zipper Closure',
      'zipper closure': 'Zipper Closure',
      'velcro': 'Velcro Closure',
      'velcro closure': 'Velcro Closure',
      'hook and loop': 'Velcro Closure',
      'breakaway': 'Breakaway',
      'break-away': 'Breakaway',
      'incident command': 'Incident Command',
      'incident': 'Incident Command',
      'public safety': 'Public Safety',
      'surveyor': 'Surveyor',
      'bomber': 'Bomber Style',
      'bomber style': 'Bomber Style',
      'parka': 'Parka Style',
      'parka style': 'Parka Style',
      'windbreaker': 'Windbreaker',
      'long sleeve': 'Long Sleeve',
      'long-sleeve': 'Long Sleeve',
      'short sleeve': 'Short Sleeve',
      'short-sleeve': 'Short Sleeve',
      'button down': 'Button Down',
      'button-down': 'Button Down',
    },
    label: 'Style',
  },
  hiVisType: {
    keywords: {
      'ansi class 2': 'ANSI Class 2',
      'class 2': 'ANSI Class 2',
      'class ii': 'ANSI Class 2',
      'ansi class 3': 'ANSI Class 3',
      'class 3': 'ANSI Class 3',
      'class iii': 'ANSI Class 3',
      'non ansi': 'Non-ANSI',
      'non-ansi': 'Non-ANSI',
      'nonansi': 'Non-ANSI',
    },
    label: 'Type',
  },
  hiVisMaterial: {
    keywords: {
      'polyester mesh': 'Polyester Mesh',
      'mesh': 'Polyester Mesh',
      'polyester tricot': 'Polyester Tricot/Solid',
      'tricot': 'Polyester Tricot/Solid',
      'solid': 'Polyester Tricot/Solid',
      'cotton': 'Cotton',
      '100% cotton': 'Cotton',
      'polyester': 'Polyester',
      '100% polyester': 'Polyester',
    },
    label: 'Material',
  },
  hiVisSize: {
    keywords: {
      'small': 'S',
      'medium': 'M',
      'large': 'L',
      ' s ': 'S',
      ' m ': 'M',
      ' l ': 'L',
      'xl': 'XL',
      '2xl': '2X',
      '2x': '2X',
      'xxl': '2X',
      '3xl': '3X',
      '3x': '3X',
      'xxxl': '3X',
      '4xl': '4X',
      '4x': '4X',
      '5xl': '5X',
      '5x': '5X',
    },
    label: 'Size',
  },
  hiVisColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange',
      'hi-vis orange': 'Hi-Vis Orange',
      'high vis orange': 'Hi-Vis Orange',
      'high-vis orange': 'Hi-Vis Orange',
      'safety orange': 'Hi-Vis Orange',
      'fluorescent orange': 'Hi-Vis Orange',
      'hi vis yellow': 'Hi-Vis Yellow',
      'hi-vis yellow': 'Hi-Vis Yellow',
      'high vis yellow': 'Hi-Vis Yellow',
      'high-vis yellow': 'Hi-Vis Yellow',
      'safety yellow': 'Hi-Vis Yellow',
      'fluorescent yellow': 'Hi-Vis Yellow',
      'lime': 'Hi-Vis Yellow',
      'lime green': 'Hi-Vis Yellow',
      'black': 'Black',
    },
    label: 'Color',
  },
  hiVisProtection: {
    keywords: {
      'fire resistant': 'Fire Resistant',
      'fire-resistant': 'Fire Resistant',
      'flame resistant': 'Fire Resistant',
      'fr ': 'Fire Resistant',
      'water resistant': 'Water Resistant',
      'water-resistant': 'Water Resistant',
      'waterproof': 'Waterproof',
      'water proof': 'Waterproof',
      'uv protection': 'UV Protection',
      'uv-protection': 'UV Protection',
      'upf': 'UV Protection',
      'insulated': 'Insulated',
      'thermal': 'Thermal',
      'dust': 'Dust Protection',
      'laser': 'Laser Protection',
    },
    label: 'Protection',
  },
  // TAA/BAA Compliance filter
  taaCompliance: {
    keywords: {
      'taa': 'TAA Compliant',
      'taa compliant': 'TAA Compliant',
      'taa-compliant': 'TAA Compliant',
      'trade agreements act': 'TAA Compliant',
      'baa': 'BAA Compliant',
      'baa compliant': 'BAA Compliant',
      'baa-compliant': 'BAA Compliant',
      'buy american': 'BAA Compliant',
      'buy american act': 'BAA Compliant',
      'made in usa': 'Made in USA',
      'made in america': 'Made in USA',
      'american made': 'Made in USA',
      'government compliant': 'Government Compliant',
    },
    label: 'TAA/BAA Approved',
  },
  // ANSI Class filter (separate from Type)
  ansiClass: {
    keywords: {
      'ansi class 2': 'ANSI Class 2',
      'class 2': 'ANSI Class 2',
      'class ii': 'ANSI Class 2',
      'ansi class 3': 'ANSI Class 3',
      'class 3': 'ANSI Class 3',
      'class iii': 'ANSI Class 3',
      'non ansi': 'Non-ANSI',
      'non-ansi': 'Non-ANSI',
      'nonansi': 'Non-ANSI',
    },
    label: 'ANSI Class',
  },
  // Sweatshirt specific styles
  sweatshirtStyle: {
    keywords: {
      'pullover crew': 'Pullover Crew Neck',
      'crew neck': 'Pullover Crew Neck',
      'crewneck': 'Pullover Crew Neck',
      'pullover hooded': 'Pullover Hooded Sweatshirt',
      'hooded sweatshirt': 'Pullover Hooded Sweatshirt',
      'hoodie': 'Pullover Hooded Sweatshirt',
      'pullover hoodie': 'Pullover Hooded Sweatshirt',
      'zipper hooded': 'Zipper Hooded Sweatshirt',
      'zip hooded': 'Zipper Hooded Sweatshirt',
      'zip hoodie': 'Zipper Hooded Sweatshirt',
      'zip-up hoodie': 'Zipper Hooded Sweatshirt',
      'full zip': 'Zipper Hooded Sweatshirt',
      'full-zip': 'Zipper Hooded Sweatshirt',
    },
    label: 'Style',
  },
  // Trouser specific styles
  trouserStyle: {
    keywords: {
      'polyester mesh': 'Polyester Mesh',
      'mesh pant': 'Polyester Mesh',
      'polyester tricot': 'Polyester Tricot',
      'tricot pant': 'Polyester Tricot',
      'waterproof bib': 'Waterproof Bib',
      'bib overall': 'Waterproof Bib',
      'waterproof pant': 'Waterproof',
      'waterproof': 'Waterproof',
      'breathable': 'Breathable',
      'breathable pant': 'Breathable',
    },
    label: 'Style',
  },
  // Trouser type (CLASS E)
  trouserType: {
    keywords: {
      'class e': 'Class E',
      'class-e': 'Class E',
      'ansi class e': 'Class E',
    },
    label: 'Type',
  },
  // Extended color palette for various categories
  extendedHiVisColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange',
      'hi-vis orange': 'Hi-Vis Orange',
      'high vis orange': 'Hi-Vis Orange',
      'safety orange': 'Hi-Vis Orange',
      'fluorescent orange': 'Hi-Vis Orange',
      'hi vis yellow': 'Hi-Vis Yellow',
      'hi-vis yellow': 'Hi-Vis Yellow',
      'high vis yellow': 'Hi-Vis Yellow',
      'safety yellow': 'Hi-Vis Yellow',
      'fluorescent yellow': 'Hi-Vis Yellow',
      'lime': 'Hi-Vis Yellow',
      'lime green': 'Hi-Vis Yellow',
      'black': 'Black',
      'navy': 'Navy',
      'navy blue': 'Navy',
      'red': 'Red',
      'green': 'Green',
      'blue': 'Blue',
      'yellow': 'Yellow',
      'orange': 'Orange',
    },
    label: 'Color',
  },
  // Rain gear specific styles
  rainGearStyle: {
    keywords: {
      'rain jacket': 'Rain Jacket',
      'rain coat': 'Rain Jacket',
      'raincoat': 'Rain Jacket',
      'rain pant': 'Rain Pant',
      'rain pants': 'Rain Pant',
      'coverall': 'Coverall',
      'coveralls': 'Coverall',
      'bib': 'Bib',
      'bib overall': 'Bib',
      'rain suit': 'Raingear Set (Pant & Jacket)',
      'rain set': 'Raingear Set (Pant & Jacket)',
      'raingear set': 'Raingear Set (Pant & Jacket)',
      '2 piece': 'Raingear Set (Pant & Jacket)',
      '2-piece': 'Raingear Set (Pant & Jacket)',
    },
    label: 'Style',
  },
  // Hi-Vis Accessory styles
  hiVisAccessoryStyle: {
    keywords: {
      'gaiter': 'Gaiters',
      'gaiters': 'Gaiters',
      'leg gaiter': 'Gaiters',
      'sash': 'Sash Belt',
      'sash belt': 'Sash Belt',
      'safety sash': 'Sash Belt',
      'seatbelt cover': 'Seatbelt Cover',
      'seat belt cover': 'Seatbelt Cover',
      'seatbelt': 'Seatbelt Cover',
    },
    label: 'Style',
  },
  // Hi-Vis Accessory colors (limited)
  hiVisAccessoryColor: {
    keywords: {
      'hi vis orange': 'Hi-Vis Orange',
      'hi-vis orange': 'Hi-Vis Orange',
      'safety orange': 'Hi-Vis Orange',
      'fluorescent orange': 'Hi-Vis Orange',
      'hi vis yellow': 'Hi-Vis Yellow',
      'hi-vis yellow': 'Hi-Vis Yellow',
      'safety yellow': 'Hi-Vis Yellow',
      'fluorescent yellow': 'Hi-Vis Yellow',
      'lime': 'Hi-Vis Yellow',
    },
    label: 'Color',
  },
  // Lens color for eyewear
  lensColor: {
    keywords: {
      'clear': 'Clear',
      'clear lens': 'Clear',
      'smoke': 'Smoke',
      'smoked': 'Smoke',
      'gray': 'Gray',
      'grey': 'Gray',
      'amber': 'Amber',
      'yellow': 'Yellow',
      'blue': 'Blue',
      'blue mirror': 'Blue Mirror',
      'silver mirror': 'Silver Mirror',
      'mirror': 'Mirror',
      'indoor/outdoor': 'Indoor/Outdoor',
      'indoor outdoor': 'Indoor/Outdoor',
      'i/o': 'Indoor/Outdoor',
      'photochromic': 'Photochromic',
      'transition': 'Photochromic',
    },
    label: 'Lens Color',
  },
  // Eyewear protection (simplified)
  eyewearProtection: {
    keywords: {
      'anti-fog': 'Anti-Fog',
      'anti fog': 'Anti-Fog',
      'antifog': 'Anti-Fog',
      'fog free': 'Anti-Fog',
      'anti-scratch': 'Anti-Scratch',
      'anti scratch': 'Anti-Scratch',
      'scratch resistant': 'Anti-Scratch',
      'hard coat': 'Anti-Scratch',
      'welding': 'Welding',
      'weld': 'Welding',
    },
    label: 'Protection',
  },
  // Eyewear accessories product type
  eyewearProduct: {
    keywords: {
      'dispenser': 'Eyewear Dispenser',
      'eyewear dispenser': 'Eyewear Dispenser',
      'glasses dispenser': 'Eyewear Dispenser',
      'lens cleaning': 'Lens Cleaning Dispenser',
      'lens cleaner': 'Lens Cleaning Dispenser',
      'cleaning dispenser': 'Lens Cleaning Dispenser',
      'cleaning station': 'Cleaning Stations',
      'cleaning stations': 'Cleaning Stations',
      'lanyard': 'Lanyards',
      'lanyards': 'Lanyards',
      'cord': 'Lanyards',
      'retainer': 'Lanyards',
      'face shield': 'Face Shields',
      'face shields': 'Face Shields',
      'faceshield': 'Face Shields',
      'side shield': 'Side Shields',
      'side shields': 'Side Shields',
      'sideshield': 'Side Shields',
    },
    label: 'Product',
  },
  // Bibs & Coveralls protection
  bibsProtection: {
    keywords: {
      'insulated': 'Insulated / Cold Weather',
      'cold weather': 'Insulated / Cold Weather',
      'thermal': 'Insulated / Cold Weather',
      'winter': 'Insulated / Cold Weather',
    },
    label: 'Protection',
  },
  // Extended protection for trousers
  trouserProtection: {
    keywords: {
      'fire resistant': 'Fire Resistant',
      'fire-resistant': 'Fire Resistant',
      'flame resistant': 'Fire Resistant',
      'fr ': 'Fire Resistant',
      'water resistant': 'Water Resistant',
      'water-resistant': 'Water Resistant',
      'waterproof': 'Waterproof',
      'ripstop': 'Ripstop',
      'rip-stop': 'Ripstop',
      'rip stop': 'Ripstop',
    },
    label: 'Protection',
  },
};

// Category-specific filter configurations
// Defines which filters to include/exclude for specific category slugs
const CATEGORY_FILTER_CONFIG: Record<string, {
  include?: string[];
  exclude?: string[];
}> = {
  // Footwear - use numeric shoe sizes
  'footwear': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'boots': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'shoes': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'safety-footwear': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'work-boots': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  // Gloves
  'gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'work-gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'hand-protection': {
    include: ['material', 'size', 'color', 'protection'],
  },
  // EAR Protection - only NRR filter
  'ear-protection': {
    include: ['nrr', 'color', 'protection'],
  },
  'hearing-protection': {
    include: ['nrr', 'color', 'protection'],
  },
  // Head Protection - hardHatType
  'head-protection': {
    include: ['hardHatType', 'color', 'protection'],
  },
  'hard-hats': {
    include: ['hardHatType', 'color', 'protection'],
  },
  // High Visibility Vests - all variations
  'vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'safety-vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'hi-vis-vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  // High Visibility Shirts - all variations
  'shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  't-shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  't-shirts--shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'hi-vis-shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  // High Visibility Jackets - all variations
  'jackets': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  'hi-vis-jackets': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  'coats': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  // High Visibility parent category
  'high-visibility': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },
  'high-visibility-clothing': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },
  'hi-vis-apparel': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },

  // ========== NEW CATEGORY CONFIGURATIONS ==========

  // Sweatshirts
  'sweatshirts': {
    include: ['taaCompliance', 'gender', 'hiVisMaterial', 'hiVisSize', 'hiVisColor', 'hiVisProtection', 'sweatshirtStyle', 'ansiClass'],
  },
  'hi-vis-sweatshirts': {
    include: ['taaCompliance', 'gender', 'hiVisMaterial', 'hiVisSize', 'hiVisColor', 'hiVisProtection', 'sweatshirtStyle', 'ansiClass'],
  },

  // Trousers
  'trousers': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },
  'hi-vis-trousers': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },
  'pants': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },

  // Bibs & Coveralls, Insulated Gear
  'bibs-coveralls-insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'bibs---coveralls--insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'coveralls': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'bibs': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },

  // High Visibility Accessories
  'high-visibility-accessories': {
    include: ['hiVisAccessoryColor', 'hiVisAccessoryStyle'],
  },
  'hi-vis-accessories': {
    include: ['hiVisAccessoryColor', 'hiVisAccessoryStyle'],
  },

  // Rain Gear
  'rain-gear': {
    include: ['taaCompliance', 'hiVisMaterial', 'hiVisSize', 'extendedHiVisColor', 'hiVisProtection', 'rainGearStyle', 'ansiClass'],
  },
  'raingear': {
    include: ['taaCompliance', 'hiVisMaterial', 'hiVisSize', 'extendedHiVisColor', 'hiVisProtection', 'rainGearStyle', 'ansiClass'],
  },

  // Eye Protection - updated
  'eye-protection': {
    include: ['taaCompliance', 'gender', 'color', 'lensColor', 'eyewearProtection', 'eyewearStyle'],
  },
  'safety-glasses': {
    include: ['taaCompliance', 'gender', 'color', 'lensColor', 'eyewearProtection', 'eyewearStyle'],
  },

  // Safety Goggles
  'safety-goggles': {
    include: ['taaCompliance', 'eyewearProtection', 'color', 'eyewearStyle', 'type'],
  },
  'goggles': {
    include: ['taaCompliance', 'eyewearProtection', 'color', 'eyewearStyle', 'type'],
  },

  // Eyewear Accessories - only product type
  'eyewear-accessories': {
    include: ['eyewearProduct'],
  },

  // Foam (Ear Protection)
  'foam': {
    include: ['taaCompliance', 'nrr'],
  },
  'foam-ear-plugs': {
    include: ['taaCompliance', 'nrr'],
  },
  'ear-plugs': {
    include: ['taaCompliance', 'nrr'],
  },

  // Ear Accessories
  'ear-accessories': {
    include: ['taaCompliance', 'nrr'],
  },
  'hearing-accessories': {
    include: ['taaCompliance', 'nrr'],
  },
};

// Check if a category or its ancestors match any filter config
function getCategoryFilterConfig(categorySlug: string, hierarchy: { slug: string }[]): { include?: string[]; exclude?: string[] } | null {
  // Normalize slug - lowercase and handle URL encoding
  const normalizedSlug = decodeURIComponent(categorySlug).toLowerCase().replace(/[,\s]+/g, '-');

  // Check current category first (try multiple variations)
  const slugVariations = [
    normalizedSlug,
    normalizedSlug.replace(/-+/g, '-'),
    normalizedSlug.split('-')[0], // First word only (e.g., "vests" from "safety-vests")
  ];

  for (const slug of slugVariations) {
    if (CATEGORY_FILTER_CONFIG[slug]) {
      return CATEGORY_FILTER_CONFIG[slug];
    }
  }

  // Check ancestors (from nearest to root)
  for (let i = hierarchy.length - 1; i >= 0; i--) {
    const ancestorSlug = hierarchy[i].slug.toLowerCase();
    const ancestorVariations = [
      ancestorSlug,
      ancestorSlug.replace(/-+/g, '-'),
      ancestorSlug.split('-')[0],
    ];

    for (const slug of ancestorVariations) {
      if (CATEGORY_FILTER_CONFIG[slug]) {
        return CATEGORY_FILTER_CONFIG[slug];
      }
    }
  }

  return null;
}

// Default filters to use when no category-specific config is found
// Excludes all specialized filters (hi-vis, eye, head, ear protection)
const DEFAULT_FILTER_CONFIG = {
  include: ['gender', 'material', 'size', 'color', 'protection', 'style', 'type'],
};

function extractSmartFilters(
  products: { name: string; description: string | null }[],
  categoryConfig?: { include?: string[]; exclude?: string[] } | null
): Record<string, string[]> {
  const filters: Record<string, Set<string>> = {};

  // Use provided config or default config (to avoid showing all filters including hi-vis)
  const effectiveConfig = categoryConfig || DEFAULT_FILTER_CONFIG;

  // Determine which filter keys to process
  let filterKeysToProcess = Object.keys(SMART_FILTER_PATTERNS);

  if (effectiveConfig.include) {
    // Only include specified filters
    filterKeysToProcess = effectiveConfig.include.filter(key => SMART_FILTER_PATTERNS[key]);
  }
  if ('exclude' in effectiveConfig && effectiveConfig.exclude) {
    // Remove excluded filters
    filterKeysToProcess = filterKeysToProcess.filter(key => !effectiveConfig.exclude!.includes(key));
  }

  for (const product of products) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();

    for (const filterKey of filterKeysToProcess) {
      const pattern = SMART_FILTER_PATTERNS[filterKey];
      if (!pattern) continue;

      if (!filters[filterKey]) {
        filters[filterKey] = new Set();
      }

      // keywords is now a Record<string, string> where key is the search term and value is the normalized display name
      for (const [searchTerm, displayName] of Object.entries(pattern.keywords)) {
        if (text.includes(searchTerm.toLowerCase())) {
          // Add the normalized display name (this prevents duplicates like Men/Men's)
          filters[filterKey].add(displayName);
        }
      }
    }
  }

  // Convert sets to arrays and filter out empty categories
  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(filters)) {
    if (values.size > 0) {
      result[key] = sortSizes(Array.from(values), key);
    }
  }

  return result;
}

// Recursive function to get full category hierarchy (ancestors)
async function getCategoryHierarchy(categoryId: string | null): Promise<{ id: string; name: string; slug: string }[]> {
  if (!categoryId) return [];

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  });

  if (!category) return [];

  const ancestors = await getCategoryHierarchy(category.parentId);
  return [...ancestors, { id: category.id, name: category.name, slug: category.slug }];
}

// Recursive function to get all descendant category IDs
async function getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: {
      parentId: categoryId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const childIds = children.map(c => c.id);
  const grandchildIds: string[] = [];

  for (const childId of childIds) {
    const descendants = await getAllDescendantCategoryIds(childId);
    grandchildIds.push(...descendants);
  }

  return [...childIds, ...grandchildIds];
}

// Get total product count for a category including all descendants
async function getTotalProductCount(categoryIds: string[]): Promise<number> {
  return db.product.count({
    where: {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: categoryIds },
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const taaApproved = searchParams.get('taaApproved') === 'true';
    const smartFilters = searchParams.get('filters'); // JSON string of active smart filters

    // Find the category
    const category = await db.category.findUnique({
      where: {
        slug: params.slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            isActive: true,
            NOT: { slug: 'traffic-safety' },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            children: {
              where: {
                isActive: true,
                NOT: { slug: 'traffic-safety' },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                _count: {
                  select: {
                    products: {
                      where: {
                        status: 'ACTIVE',
                        stockQuantity: { gt: 0 },
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                products: {
                  where: {
                    status: 'ACTIVE',
                    stockQuantity: { gt: 0 },
                  },
                },
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get ALL descendant category IDs recursively for product search
    const allDescendantIds = await getAllDescendantCategoryIds(category.id);
    const categoryIds = [category.id, ...allDescendantIds];

    // Calculate total products including all descendants for each child category
    const childrenWithTotals = await Promise.all(
      category.children.map(async (child) => {
        const childDescendants = await getAllDescendantCategoryIds(child.id);
        const totalProducts = await getTotalProductCount([child.id, ...childDescendants]);
        return {
          ...child,
          _count: {
            products: totalProducts,
          },
        };
      })
    );

    // Sort children by product count (most products first)
    childrenWithTotals.sort((a, b) => b._count.products - a._count.products);

    // Build product filter
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: categoryIds },
    };

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { vendorPartNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add brand filter
    if (brand) {
      const brandData = await db.brand.findUnique({
        where: { slug: brand },
        select: { id: true },
      });
      if (brandData) {
        where.brandId = brandData.id;
      }
    }

    // Add TAA/BAA filter (products with GSA price > 0)
    if (taaApproved) {
      where.gsaPrice = { gt: 0 };
    }

    // Add smart filters
    if (smartFilters) {
      try {
        const parsedFilters = JSON.parse(smartFilters) as Record<string, string[]>;
        const filterConditions: any[] = [];

        for (const [, values] of Object.entries(parsedFilters)) {
          if (values && values.length > 0) {
            for (const value of values) {
              filterConditions.push({
                OR: [
                  { name: { contains: value, mode: 'insensitive' } },
                  { description: { contains: value, mode: 'insensitive' } },
                ],
              });
            }
          }
        }

        if (filterConditions.length > 0) {
          where.AND = filterConditions;
        }
      } catch (e) {
        // Invalid JSON, ignore filters
      }
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price-desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    // Fetch products with reviews aggregation
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          vendorPartNumber: true,
          name: true,
          slug: true,
          description: true,
          basePrice: true,
          salePrice: true,
          images: true,
          isFeatured: true,
          stockQuantity: true,
          minimumOrderQty: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          _count: {
            select: {
              reviews: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Get average ratings for products
    const productIds = products.map((p) => p.id);
    const reviewAggregates = await db.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: 'APPROVED',
      },
      _avg: {
        rating: true,
      },
    });

    const ratingMap = new Map(
      reviewAggregates.map((r) => [r.productId, r._avg.rating || 0])
    );

    // Format products with ratings
    const formattedProducts = products.map((product) => ({
      id: product.id,
      sku: product.vendorPartNumber || product.sku, // Display vendorPartNumber as SKU
      manufacturerPartNumber: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      isFeatured: product.isFeatured,
      stockQuantity: product.stockQuantity,
      minimumOrderQty: product.minimumOrderQty,
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
      brand: product.brand,
    }));

    // Get full hierarchy (all ancestors) - needed for category filter config
    const hierarchy = await getCategoryHierarchy(category.parentId);

    // Get category-specific filter configuration
    const categoryFilterConfig = getCategoryFilterConfig(category.slug, hierarchy);

    // Get all products for smart filter extraction (without pagination)
    const allProductsForFilters = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        stockQuantity: { gt: 0 },
        categoryId: { in: categoryIds },
      },
      select: {
        name: true,
        description: true,
      },
    });

    // Extract smart filters from all products in this category (with category-specific config)
    const availableSmartFilters = extractSmartFilters(allProductsForFilters, categoryFilterConfig);

    // Get filter labels for the response
    const smartFilterLabels: Record<string, string> = {};
    for (const key of Object.keys(availableSmartFilters)) {
      if (SMART_FILTER_PATTERNS[key]) {
        smartFilterLabels[key] = SMART_FILTER_PATTERNS[key].label;
      }
    }

    // Fetch brands that have products in this category
    const brands = await db.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            status: 'ACTIVE',
            stockQuantity: { gt: 0 },
            categoryId: { in: categoryIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
                categoryId: { in: categoryIds },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build category response with updated children counts, nested children, and full hierarchy
    const categoryResponse = {
      ...category,
      children: childrenWithTotals, // Include nested children for subcategory display
      hierarchy, // Full path from root to parent (not including current category)
    };

    return NextResponse.json({
      category: categoryResponse,
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      smartFilters: availableSmartFilters,
      smartFilterLabels,
      brands,
    });
  } catch (error: any) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
