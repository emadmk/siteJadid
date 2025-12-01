/**
 * Image URL utility functions
 * Converts between different image sizes (thumb, medium, large, original)
 */

export type ImageSize = 'thumb' | 'medium' | 'large' | 'original';

/**
 * Convert an image URL from one size to another
 * Handles both new format (thumb-xxx.webp) and old format URLs
 */
export function getImageSize(url: string | null | undefined, targetSize: ImageSize): string {
  if (!url) return '';

  // Check if it's our processed image format (contains size prefix)
  const sizePatterns = ['thumb-', 'medium-', 'large-', 'original-'];
  const hasSize = sizePatterns.some(pattern => url.includes(pattern));

  if (!hasSize) {
    // Old format or external URL - return as is
    return url;
  }

  // Replace the size prefix with target size
  let result = url;
  for (const pattern of sizePatterns) {
    if (url.includes(pattern)) {
      result = url.replace(pattern, `${targetSize}-`);
      break;
    }
  }

  return result;
}

/**
 * Get optimized image URL for display context
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  context: 'thumbnail' | 'card' | 'gallery' | 'zoom' | 'hero'
): string {
  if (!url) return '';

  switch (context) {
    case 'thumbnail':
      return getImageSize(url, 'thumb');
    case 'card':
      return getImageSize(url, 'medium');
    case 'gallery':
      return getImageSize(url, 'large');
    case 'zoom':
    case 'hero':
      return getImageSize(url, 'original');
    default:
      return url;
  }
}

/**
 * Get all sizes for an image URL
 */
export function getAllImageSizes(url: string | null | undefined): {
  thumb: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumb: getImageSize(url, 'thumb'),
    medium: getImageSize(url, 'medium'),
    large: getImageSize(url, 'large'),
    original: getImageSize(url, 'original'),
  };
}
