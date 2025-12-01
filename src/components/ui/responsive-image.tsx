'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  // Multiple size URLs
  thumbUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  originalUrl?: string;
  // Sizing
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  // Styling
  className?: string;
  containerClassName?: string;
  // Behavior
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  // Placeholder
  showPlaceholder?: boolean;
  placeholderColor?: string;
  // Click behavior
  onClick?: () => void;
  zoomOnHover?: boolean;
}

/**
 * Responsive Image Component
 * - Supports multiple image sizes (thumb, medium, large, original)
 * - Lazy loading with blur placeholder
 * - Responsive srcset for optimal loading
 * - Zoom on hover effect
 * - Fallback handling
 */
export function ResponsiveImage({
  src,
  alt,
  thumbUrl,
  mediumUrl,
  largeUrl,
  originalUrl,
  width,
  height,
  fill = false,
  sizes = '100vw',
  className,
  containerClassName,
  priority = false,
  loading = 'lazy',
  quality = 80,
  showPlaceholder = true,
  placeholderColor = '#f3f4f6',
  onClick,
  zoomOnHover = false,
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Use the best available URL
  const imageUrl = src || mediumUrl || largeUrl || thumbUrl || originalUrl || '';

  // Generate srcSet if multiple sizes available
  const generateSrcSet = () => {
    const sources: string[] = [];

    if (thumbUrl) {
      sources.push(`${thumbUrl} 200w`);
    }
    if (mediumUrl) {
      sources.push(`${mediumUrl} 600w`);
    }
    if (largeUrl) {
      sources.push(`${largeUrl} 1200w`);
    }
    if (originalUrl) {
      sources.push(`${originalUrl} 2400w`);
    }

    return sources.length > 0 ? sources.join(', ') : undefined;
  };

  if (hasError || !imageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100',
          containerClassName
        )}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const srcSet = generateSrcSet();

  if (fill) {
    return (
      <div
        className={cn('relative overflow-hidden', containerClassName)}
        onClick={onClick}
      >
        {showPlaceholder && isLoading && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ backgroundColor: placeholderColor }}
          />
        )}
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : loading}
          className={cn(
            'object-cover transition-all duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            zoomOnHover && 'group-hover:scale-105',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width, height }}
      onClick={onClick}
    >
      {showPlaceholder && isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
      {/* Use native img for srcSet support, or Next Image for optimization */}
      {srcSet ? (
        <img
          src={imageUrl}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading}
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            zoomOnHover && 'group-hover:scale-105',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      ) : (
        <Image
          src={imageUrl}
          alt={alt}
          width={width || 400}
          height={height || 400}
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : loading}
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            zoomOnHover && 'group-hover:scale-105',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

/**
 * Product Image Gallery Component
 */
interface ProductImageGalleryProps {
  images: Array<{
    id?: string;
    thumbUrl: string;
    mediumUrl?: string;
    largeUrl?: string;
    originalUrl?: string;
    altText?: string;
  }>;
  productName: string;
  className?: string;
}

export function ProductImageGallery({
  images,
  productName,
  className,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={cn('aspect-square bg-gray-100 rounded-lg flex items-center justify-center', className)}>
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image */}
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 group">
        <ResponsiveImage
          src={selectedImage.largeUrl || selectedImage.mediumUrl || selectedImage.thumbUrl}
          thumbUrl={selectedImage.thumbUrl}
          mediumUrl={selectedImage.mediumUrl}
          largeUrl={selectedImage.largeUrl}
          originalUrl={selectedImage.originalUrl}
          alt={selectedImage.altText || `${productName} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          zoomOnHover
          containerClassName="w-full h-full"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-safety-green-500 ring-2 ring-safety-green-200'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <ResponsiveImage
                src={image.thumbUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
