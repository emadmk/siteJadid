/**
 * Variant Detection Service
 *
 * Automatically detects and groups products with variants from Excel import data.
 * Examples:
 *   1006980-7, 1006980-8, 1006980-9 → Product: 1006980 with size variants 7, 8, 9
 *   HV-VEST-S-OR, HV-VEST-M-OR, HV-VEST-L-OR → Product: HV-VEST with size/color variants
 */

export interface ExcelRow {
  sku: string;
  name: string;
  basePrice?: number;
  salePrice?: number;
  wholesalePrice?: number;
  gsaPrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  [key: string]: unknown;
}

export interface VariantGroup {
  basePartNumber: string;
  baseName: string;
  baseRow: ExcelRow;
  variants: ExcelRow[];
  variantAttributes: string[]; // Column names that differ between variants
  detectedPattern: string;
}

export interface DetectionResult {
  groups: VariantGroup[];
  standaloneProducts: ExcelRow[];
  stats: {
    totalRows: number;
    groupCount: number;
    totalVariants: number;
    standaloneCount: number;
  };
}

/**
 * Extract base part number from SKU
 *
 * Patterns supported:
 *   1006980-7      → 1006980 (numeric base with size suffix)
 *   1006980-8.5    → 1006980 (numeric base with decimal size)
 *   K-1006980-7    → 1006980 (prefix + numeric base with size)
 *   K-1007969-9EE  → 1007969 (prefix + numeric base with size+width code)
 *   K-1007969-11.5D → 1007969 (prefix + numeric base with decimal size+width)
 *   HV-VEST-S-OR   → HV-VEST (prefix base with size-color suffix)
 *   ABC123-RED-L   → ABC123 (alphanumeric base with attribute suffixes)
 */
export function extractBasePartNumber(sku: string): string {
  if (!sku) return '';

  const cleanSku = sku.trim().toUpperCase();

  // Pattern 1: Numbers followed by dash and size (1006980-7, 1006980-8.5)
  const numericPattern = /^(\d{5,8})-[\d.]+[A-Z]*$/;
  const numericMatch = cleanSku.match(numericPattern);
  if (numericMatch) return numericMatch[1];

  // Pattern 2: Prefix-Number pattern with size suffix
  // K-1006980-7, K-1007969-9EE, K-1007969-11.5D
  const prefixNumericPattern = /^[A-Z]+-(\d{5,8})-[\d.]+[A-Z]*$/;
  const prefixNumericMatch = cleanSku.match(prefixNumericPattern);
  if (prefixNumericMatch) return prefixNumericMatch[1];

  // Pattern 3: Vendor part number format (K-1006999-7 from vendor_part_number)
  // Also handles K-1007969-10.5EE type patterns
  const vendorPattern = /^[A-Z]+-(\d{6,8})-\d+\.?\d*[A-Z]*$/;
  const vendorMatch = cleanSku.match(vendorPattern);
  if (vendorMatch) return vendorMatch[1];

  // Pattern 4: Standard SKU with size/color suffix (ABC123-RED-L)
  // Take everything before the last 2 segments if they look like attributes
  const parts = cleanSku.split('-');
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    // Check if last parts are size codes or colors
    const sizePatterns = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+\.?\d*[A-Z]*|W\d+)$/;
    const colorPatterns = /^(RED|BLUE|GREEN|BLACK|WHITE|ORANGE|YELLOW|NAVY|GREY|GRAY|OR|BL|GR|WH|BK|YL)$/;

    // Special case: if second part is a long number (product code), use it as base
    if (/^\d{6,8}$/.test(secondLastPart)) {
      return secondLastPart;
    }

    if (sizePatterns.test(lastPart) || colorPatterns.test(lastPart)) {
      // Remove the last part
      const base = parts.slice(0, -1).join('-');

      // Also check if second-to-last is a size/color
      if (sizePatterns.test(secondLastPart) || colorPatterns.test(secondLastPart)) {
        return parts.slice(0, -2).join('-');
      }
      return base;
    }

    // For patterns like MTR-1-115-1 (motor specs), take first 1-2 parts
    // But NOT for single letter prefixes like K-
    if (parts[0].length > 1 && parts[0].length <= 4) {
      return parts.slice(0, Math.min(2, parts.length - 2)).join('-');
    }

    // If first part is single letter (K, etc), second part might be the real base
    if (parts[0].length === 1 && parts.length >= 2) {
      // Check if second part is the product code
      if (/^\d{5,8}$/.test(parts[1])) {
        return parts[1];
      }
    }

    return parts[0];
  }

  // Pattern 5: Just numeric suffix (ABC123XL → ABC123)
  const trailingSizePattern = /^(.+?)(XXS|XS|S|M|L|XL|XXL|XXXL)$/;
  const trailingSizeMatch = cleanSku.match(trailingSizePattern);
  if (trailingSizeMatch) return trailingSizeMatch[1];

  // No pattern matched, return original SKU
  return cleanSku;
}

/**
 * Extract variant attribute value from SKU
 */
export function extractVariantValue(sku: string, basePart: string): string {
  if (!sku || !basePart) return '';

  const cleanSku = sku.trim().toUpperCase();
  const cleanBase = basePart.trim().toUpperCase();

  // Get the suffix after the base part
  if (cleanSku.startsWith(cleanBase)) {
    const suffix = cleanSku.slice(cleanBase.length).replace(/^[-_]/, '');
    return suffix;
  }

  // Try to find base within the SKU
  const baseIndex = cleanSku.indexOf(cleanBase);
  if (baseIndex >= 0) {
    const suffix = cleanSku.slice(baseIndex + cleanBase.length).replace(/^[-_]/, '');
    return suffix;
  }

  return '';
}

/**
 * Find columns that have different values across rows
 */
function findDifferingColumns(rows: ExcelRow[]): string[] {
  if (rows.length < 2) return [];

  const columns = Object.keys(rows[0]).filter(k =>
    k !== 'sku' &&
    k !== 'rowNumber' &&
    k !== 'rawData' &&
    k !== 'metadata'
  );

  const differing: string[] = [];

  for (const col of columns) {
    const values = new Set(rows.map(r => {
      const val = r[col];
      if (val === null || val === undefined) return '';
      return String(val).trim().toLowerCase();
    }));

    // If there are multiple distinct non-empty values, it's a variant attribute
    const nonEmptyValues = Array.from(values).filter(v => v !== '');
    if (nonEmptyValues.length > 1) {
      differing.push(col);
    }
  }

  return differing;
}

/**
 * Clean product name by removing variant-specific parts
 */
function cleanBaseName(name: string, variantAttributes: string[]): string {
  if (!name) return '';

  let cleaned = name;

  // Remove common variant patterns from name
  const patternsToRemove = [
    /\s*-?\s*size\s*:?\s*\d+\.?\d*/gi,
    /\s*-?\s*color\s*:?\s*\w+/gi,
    /\s*-?\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s*$/gi,
    /\s*-?\s*(Red|Blue|Green|Black|White|Orange|Yellow|Navy|Grey|Gray)\s*$/gi,
    /\s*\(\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)/gi,
  ];

  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * Group Excel rows by base SKU pattern
 */
export function groupByBasePartNumber(rows: ExcelRow[]): DetectionResult {
  const groups = new Map<string, ExcelRow[]>();

  // Group by base part number
  for (const row of rows) {
    if (!row.sku) continue;

    const base = extractBasePartNumber(row.sku);
    if (!groups.has(base)) {
      groups.set(base, []);
    }
    groups.get(base)!.push(row);
  }

  const variantGroups: VariantGroup[] = [];
  const standaloneProducts: ExcelRow[] = [];

  for (const [base, variants] of groups) {
    if (variants.length === 1) {
      // Single product, no variants
      standaloneProducts.push(variants[0]);
      continue;
    }

    // Find which columns differ between variants
    const variantAttributes = findDifferingColumns(variants);

    // If no differing columns found (except price/stock), might not be true variants
    const meaningfulDiffs = variantAttributes.filter(attr =>
      !['stockQuantity', 'basePrice', 'salePrice', 'gsaPrice', 'costPrice', 'wholesalePrice'].includes(attr)
    );

    if (meaningfulDiffs.length === 0 && variantAttributes.length === 0) {
      // No real differences, treat as separate products
      standaloneProducts.push(...variants);
      continue;
    }

    // Create variant group
    const baseRow = variants[0];
    variantGroups.push({
      basePartNumber: base,
      baseName: cleanBaseName(baseRow.name, variantAttributes),
      baseRow,
      variants,
      variantAttributes,
      detectedPattern: detectPattern(variants.map(v => v.sku)),
    });
  }

  return {
    groups: variantGroups,
    standaloneProducts,
    stats: {
      totalRows: rows.length,
      groupCount: variantGroups.length,
      totalVariants: variantGroups.reduce((sum, g) => sum + g.variants.length, 0),
      standaloneCount: standaloneProducts.length,
    },
  };
}

/**
 * Detect the SKU pattern used for variants
 */
function detectPattern(skus: string[]): string {
  if (skus.length < 2) return 'unknown';

  const sample = skus[0];

  // Check for numeric size suffix pattern
  if (/\d{5,}-\d+\.?\d*$/.test(sample)) {
    return 'numeric-size';
  }

  // Check for size code suffix
  if (/-(XXS|XS|S|M|L|XL|XXL|XXXL)(-|$)/i.test(sample)) {
    return 'size-code';
  }

  // Check for color suffix
  if (/-(RED|BLUE|GREEN|BLACK|WHITE|OR|BL|GR)(-|$)/i.test(sample)) {
    return 'color-suffix';
  }

  // Check for combined size-color
  if (/-(S|M|L|XL)-(OR|BL|GR|WH|BK)/i.test(sample)) {
    return 'size-color';
  }

  return 'custom';
}

/**
 * Detect category from Excel column headers
 */
export function detectCategoryFromHeaders(headers: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase());

  // Motor/electrical products
  if (lowerHeaders.some(h =>
    h.includes('hp') ||
    h.includes('horsepower') ||
    h.includes('voltage') ||
    h.includes('phase') ||
    h.includes('rpm')
  )) {
    return 'electric-motors';
  }

  // Apparel with size and color
  if (lowerHeaders.some(h => h.includes('size')) &&
      lowerHeaders.some(h => h.includes('color'))) {
    return 'apparel';
  }

  // Footwear (size only, no color typically in column)
  if (lowerHeaders.some(h => h.includes('size')) &&
      lowerHeaders.some(h => h.includes('width'))) {
    return 'footwear';
  }

  // Just size
  if (lowerHeaders.some(h => h.includes('size'))) {
    return 'sized-products';
  }

  return null;
}

/**
 * Build variant name from attribute values
 */
export function buildVariantName(attributeValues: Record<string, string>): string {
  const parts: string[] = [];

  for (const [attr, value] of Object.entries(attributeValues)) {
    if (value) {
      // Capitalize attribute name nicely
      const attrName = attr.charAt(0).toUpperCase() + attr.slice(1).replace(/_/g, ' ');
      parts.push(`${attrName}: ${value}`);
    }
  }

  return parts.join(', ');
}

/**
 * Parse variant suffix into attribute values
 * Example: "L-OR" → { size: "L", color: "OR" }
 * Example: "9EE" → { size: "9", width: "EE" }
 * Example: "11.5D" → { size: "11.5", width: "D" }
 */
export function parseVariantSuffix(
  suffix: string,
  attributeNames: string[] = ['size', 'width', 'color']
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!suffix) return result;

  // Check for combined size+width pattern (9EE, 11.5D, 10.5EE, 7D, etc.)
  const sizeWidthPattern = /^(\d+\.?\d*)(D|E|EE|EEE|EEEE|4E|6E|W|N|M|B|C|AA|AAA)$/i;
  const sizeWidthMatch = suffix.match(sizeWidthPattern);
  if (sizeWidthMatch) {
    result.size = sizeWidthMatch[1];
    result.width = sizeWidthMatch[2].toUpperCase();
    return result;
  }

  const parts = suffix.split('-').filter(p => p);

  // Size patterns (numeric or standard size codes)
  const sizePattern = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+\.?\d*|W\d+)$/i;
  // Width patterns (shoe widths)
  const widthPattern = /^(D|E|EE|EEE|EEEE|4E|6E|W|N|M|B|C|AA|AAA)$/i;
  // Color patterns
  const colorPattern = /^(RED|BLUE|GREEN|BLACK|WHITE|ORANGE|YELLOW|NAVY|GREY|GRAY|OR|BL|GR|WH|BK|YL|NV)$/i;

  for (const part of parts) {
    // Check for combined size+width in a single part
    const combinedMatch = part.match(sizeWidthPattern);
    if (combinedMatch) {
      result.size = combinedMatch[1];
      result.width = combinedMatch[2].toUpperCase();
      continue;
    }

    if (sizePattern.test(part) && !result.size) {
      result.size = part.toUpperCase();
    } else if (widthPattern.test(part) && !result.width) {
      result.width = part.toUpperCase();
    } else if (colorPattern.test(part) && !result.color) {
      result.color = part.toUpperCase();
    } else if (!result[attributeNames[Object.keys(result).length] || 'other']) {
      // Unknown attribute, use next available name
      const nextAttr = attributeNames[Object.keys(result).length] || `attr${Object.keys(result).length}`;
      result[nextAttr] = part;
    }
  }

  return result;
}
