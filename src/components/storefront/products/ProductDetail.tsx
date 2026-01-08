'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ChevronRight,
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RefreshCw,
  Package,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ZoomIn,
  Award,
  Building2,
  FileText,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { useWishlist } from '@/hooks/useWishlist';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { toast } from '@/lib/toast';
import { getImageSize, getOptimizedImageUrl } from '@/lib/image-utils';
import { VariantSelector } from './VariantSelector';
import { ProductInlineEditor } from './ProductInlineEditor';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
  };
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  images: string[];
}

interface TieredPrice {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface AttributeValue {
  attributeId: string;
  value: string;
  attribute: {
    id: string;
    name: string;
    code: string;
  };
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  color?: string | null;
  size?: string | null;
  type?: string | null;
  material?: string | null;
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
  priceUnit?: string;
  qtyPerPack?: number;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  attributeValues: AttributeValue[];
}

interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

interface ProductDetailProps {
  product: {
    id: string;
    sku: string;
    manufacturerPartNumber?: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    basePrice: number;
    salePrice: number | null;
    wholesalePrice: number | null;
    gsaPrice: number | null;
    costPrice: number | null;
    priceUnit?: string;
    qtyPerPack?: number;
    images: string[];
    colorImages?: Record<string, number[]> | null;
    isFeatured: boolean;
    isBestSeller: boolean;
    isNewArrival: boolean;
    stockQuantity: number;
    lowStockThreshold: number | null;
    minimumOrderQty: number;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    status: string;
    categoryId: string | null;
    brandId: string | null;
    defaultSupplierId: string | null;
    defaultWarehouseId: string | null;
    complianceCertifications: string[];
    categoryHierarchy: CategoryBreadcrumb[];
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    brand: {
      id: string;
      name: string;
      slug: string;
    } | null;
    reviews: Review[];
    tieredPrices: TieredPrice[];
    variants?: Variant[];
  };
  relatedProducts: RelatedProduct[];
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { data: session } = useSession();
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
  const { addProduct } = useRecentlyViewed();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [copied, setCopied] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Bulk Order Modal
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [bulkOrderForm, setBulkOrderForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    quantity: '',
    timeline: '',
    message: '',
  });
  const [isSubmittingBulkOrder, setIsSubmittingBulkOrder] = useState(false);

  // Handle color change - filter images based on colorImages mapping
  const handleColorChange = (color: string | null) => {
    setSelectedColor(color);
    // Reset to first image when color changes
    if (color && product.colorImages && product.colorImages[color] && product.colorImages[color].length > 0) {
      // Color has mapped images - set to first mapped image
      setSelectedImage(0); // Always use index 0 of the filtered displayImages
    } else {
      // No mapping for this color - reset to first product image
      setSelectedImage(0);
    }
  };

  // Get images to display - filtered by color if applicable
  // Only use color mapping if the color has actual images mapped
  const colorHasImages = selectedColor && product.colorImages && product.colorImages[selectedColor] && product.colorImages[selectedColor].length > 0;
  const displayImages = colorHasImages
    ? (product.colorImages![selectedColor!] as number[]).map((idx: number) => product.images[idx]).filter(Boolean)
    : product.images;

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  // Determine if product has variants
  const hasVariants = product.variants && product.variants.length > 0;

  // Get current price and stock based on variant selection
  const currentPrice = selectedVariant
    ? (selectedVariant.salePrice || selectedVariant.basePrice)
    : (product.salePrice || product.basePrice);
  const currentBasePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const currentWholesalePrice = selectedVariant?.wholesalePrice || product.wholesalePrice;
  const currentGsaPrice = selectedVariant?.gsaPrice || product.gsaPrice;
  const currentPriceUnit = selectedVariant?.priceUnit || product.priceUnit || 'ea';
  const currentQtyPerPack = selectedVariant?.qtyPerPack || product.qtyPerPack || 1;

  // Map unit codes to full labels
  const unitLabels: Record<string, string> = {
    'ea': 'each',
    'pk': 'pack',
    'pr': 'pair',
    'dz': 'dozen',
    'DZ': 'dozen',
    'bx': 'box',
    'BX': 'box',
    'cs': 'case',
    'CS': 'case',
  };
  const unitLabel = unitLabels[currentPriceUnit] || currentPriceUnit;

  // Track product view
  useEffect(() => {
    addProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      images: product.images,
    });
  }, [product.id]);

  const images = displayImages.length > 0 ? displayImages : (product.images || []);
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  const hasDimensions = product.length && product.width && product.height;
  const hasDiscount = currentPrice < currentBasePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - currentPrice / currentBasePrice) * 100)
    : 0;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(product.id);
  };

  const handleOpenReviewModal = () => {
    if (!session?.user) {
      toast.error('Please sign in to write a review');
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error('Please sign in to write a review');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle || undefined,
          comment: reviewComment || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment('');
      setReviewTitle('');
      // Refresh the page to show the new review
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitBulkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBulkOrder(true);

    try {
      const response = await fetch('/api/storefront/quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bulkOrderForm,
          productId: product.id,
          productName: product.name,
          productSku: currentSku,
          variantId: selectedVariant?.id,
          variantName: selectedVariant?.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      toast.success('Bulk order request submitted! We will contact you shortly.');
      setShowBulkOrderModal(false);
      setBulkOrderForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        quantity: '',
        timeline: '',
        message: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsSubmittingBulkOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs bg-safety-green-600 px-2 py-1 rounded font-medium">
                  Admin Mode
                </span>
                <span className="text-sm text-gray-400">
                  Product ID: {product.id}
                </span>
                <span className="text-sm text-gray-400">
                  Status: <span className={`font-medium ${
                    product.status === 'ACTIVE' ? 'text-green-400' :
                    product.status === 'DRAFT' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{product.status}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEditDrawer(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-safety-green-600 hover:bg-safety-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Quick Edit
                </button>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Full Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/categories" className="text-gray-600 hover:text-safety-green-600">
              Categories
            </Link>
            {/* Show full category hierarchy */}
            {product.categoryHierarchy && product.categoryHierarchy.map((cat) => (
              <span key={cat.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link
                  href={`/categories/${cat.slug}`}
                  className="text-gray-600 hover:text-safety-green-600"
                >
                  {cat.name}
                </Link>
              </span>
            ))}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square cursor-zoom-in"
              onClick={() => setShowZoom(true)}
            >
              {images[selectedImage] ? (
                <img
                  src={getImageSize(images[selectedImage], 'large')}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <ShieldCheck className="w-32 h-32 text-gray-300" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isFeatured && (
                  <span className="bg-safety-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Zoom indicator */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <ZoomIn className="w-3 h-3" />
                Click to zoom
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'border-safety-green-600 ring-2 ring-safety-green-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category, Brand & SKU */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {product.category && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-safety-green-600 hover:text-safety-green-700 font-medium"
                >
                  {product.category.name}
                </Link>
              )}
              {product.brand && (
                <Link
                  href={`/brands/${product.brand.slug}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {product.brand.name}
                </Link>
              )}
              <span className="text-gray-500">SKU: {currentSku}</span>
            </div>

            {/* Title */}
            <div className="flex items-start gap-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black flex-1">
                {product.name}
              </h1>
              {isAdmin && (
                <button
                  onClick={() => setShowEditDrawer(true)}
                  className="p-2 bg-safety-green-100 hover:bg-safety-green-200 text-safety-green-700 rounded-lg transition-colors flex-shrink-0"
                  title="Edit Product"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Rating */}
            {product.reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({product.reviews.length}{' '}
                  {product.reviews.length === 1 ? 'review' : 'reviews'})
                </span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-sm text-safety-green-600 hover:underline"
                >
                  Read reviews
                </button>
              </div>
            )}

            {/* Variant Selector */}
            {hasVariants && (
              <div className="space-y-4 pt-2 pb-2 border-t border-b border-gray-200">
                <VariantSelector
                  variants={product.variants!}
                  onVariantSelect={setSelectedVariant}
                  selectedVariantId={selectedVariant?.id}
                  onColorChange={handleColorChange}
                />
              </div>
            )}

            {/* Price Section - Clean & Professional */}
            <div className="space-y-4">
              {/* Main Price */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-bold text-gray-900">
                  ${Number(currentPrice).toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 font-medium">
                  per {unitLabel}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ${Number(currentBasePrice).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      SAVE {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* GSA & B2B Pricing - Compact Inline */}
              {(currentWholesalePrice || currentGsaPrice) && (
                <div className="flex flex-wrap items-center gap-3">
                  {currentGsaPrice && (
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <FileText className="w-4 h-4" />
                      Government Price: ${Number(currentGsaPrice).toFixed(2)}
                    </div>
                  )}
                  {currentWholesalePrice && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <Building2 className="w-4 h-4" />
                      B2B: ${Number(currentWholesalePrice).toFixed(2)}
                    </div>
                  )}
                  {currentGsaPrice && (
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                      TAA/BAA Approved
                    </div>
                  )}
                </div>
              )}

              {/* Tiered Pricing */}
              {product.tieredPrices.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Volume Discounts</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {product.tieredPrices.map((tier) => (
                      <div key={tier.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
                        <div className="font-medium text-gray-700 text-xs">
                          {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} units
                        </div>
                        <div className="text-safety-green-600 font-bold">
                          ${Number(tier.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {/* Show warning if variants exist but none selected */}
              {hasVariants && !selectedVariant ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-600">Select options to check availability</span>
                </>
              ) : currentStock > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                  <span className="font-medium text-safety-green-600">
                    {currentStock > 20
                      ? 'In Stock - Ready to Ship'
                      : `Only ${currentStock} left in stock`}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Add to Cart */}
            <div className="pt-4 border-t">
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant?.id}
                stockQuantity={currentStock}
                showQuantitySelector={true}
                disabled={hasVariants && !selectedVariant}
                minimumQuantity={1}
                unitPrice={currentPrice}
                priceUnit={currentPriceUnit}
                minOrderQty={product.minimumOrderQty || 1}
              />
              {hasVariants && !selectedVariant && (
                <p className="text-sm text-amber-600 mt-2">
                  Please select all options before adding to cart
                </p>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isInWishlist(product.id)
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                {isInWishlist(product.id) ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <Link
                href="/quick-order"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Package className="w-5 h-5" />
                Quick Order
              </Link>
            </div>

            {/* Request Bulk Order */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-black text-black hover:bg-black hover:text-white"
              onClick={() => setShowBulkOrderModal(true)}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Request Volume Order
            </Button>

            {/* Trust Badges */}
            <div className={`grid grid-cols-2 ${currentGsaPrice ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 pt-4 border-t`}>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-black">Fast Shipping</div>
                  <div className="text-xs text-gray-600">Same-day dispatch</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-black">ANSI Certified</div>
                  <div className="text-xs text-gray-600">Meets standards</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-black">Easy Returns</div>
                  <div className="text-xs text-gray-600">30-day policy</div>
                </div>
              </div>
              {currentGsaPrice && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-black">TAA/BAA Approved</div>
                    <div className="text-xs text-gray-600">Government compliant</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-12">
          {/* Tab Headers */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'description'
                  ? 'text-safety-green-600 border-b-2 border-safety-green-600'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'specs'
                  ? 'text-safety-green-600 border-b-2 border-safety-green-600'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-safety-green-600 border-b-2 border-safety-green-600'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Reviews ({product.reviews.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {product.description ? (
                  <div
                    className="text-gray-700 leading-relaxed [&>p]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">SKU</div>
                  <div className="font-medium text-black">{product.sku}</div>
                </div>
                {product.manufacturerPartNumber && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Manufacturer Part Number</div>
                    <div className="font-medium text-black">{product.manufacturerPartNumber}</div>
                  </div>
                )}
                {product.weight && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Weight</div>
                    <div className="font-medium text-black">{Number(product.weight)} lbs</div>
                  </div>
                )}
                {hasDimensions && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Dimensions</div>
                    <div className="font-medium text-black">
                      {Number(product.length)}" × {Number(product.width)}" × {Number(product.height)}"
                    </div>
                  </div>
                )}
                {product.category && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Category</div>
                    <div className="font-medium text-black">{product.category.name}</div>
                  </div>
                )}
                {product.brand && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Brand</div>
                    <Link href={`/brands/${product.brand.slug}`} className="font-medium text-blue-600 hover:underline">
                      {product.brand.name}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {product.reviews.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-black">
                        Customer Reviews ({product.reviews.length})
                      </h3>
                      <Button
                        onClick={handleOpenReviewModal}
                        className="bg-safety-green-600 hover:bg-safety-green-700"
                      >
                        Write a Review
                      </Button>
                    </div>
                    <div className="space-y-6">
                      {product.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b border-gray-200 pb-6 last:border-0"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-black">
                                {review.user.name || 'Anonymous'}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-gray-200 text-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-black mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Be the first to review this product
                    </p>
                    <Button
                      onClick={handleOpenReviewModal}
                      className="bg-safety-green-600 hover:bg-safety-green-700"
                    >
                      Write a Review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-black mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.slug}`}>
                  <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden">
                    <div className="w-full h-40 md:h-48 bg-gray-100 overflow-hidden">
                      {relatedProduct.images?.[0] ? (
                        <img
                          src={getImageSize(relatedProduct.images[0], 'medium')}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShieldCheck className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors text-sm md:text-base">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-black">
                          ${Number(relatedProduct.salePrice || relatedProduct.basePrice).toFixed(2)}
                        </span>
                        {relatedProduct.salePrice && relatedProduct.salePrice < relatedProduct.basePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${Number(relatedProduct.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {showZoom && images[selectedImage] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <button
            onClick={() => setShowZoom(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={getImageSize(images[selectedImage], 'original')}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-black mb-6">Write a Review</h2>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Product Name */}
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                Reviewing: <span className="font-medium text-black">{product.name}</span>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Your Rating *
                </label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          i < (hoverRating || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewRating} out of 5
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Sum up your review in a few words"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Your Review (optional)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 bg-safety-green-600 hover:bg-safety-green-700"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Order Modal */}
      {showBulkOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBulkOrderModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-black mb-2">Request Volume Order</h3>
            <p className="text-gray-600 text-sm mb-4">
              Fill out the form below and our team will contact you with pricing.
            </p>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                {images[0] && (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-medium text-black line-clamp-1">{product.name}</div>
                  <div className="text-sm text-gray-600">SKU: {currentSku}</div>
                  {selectedVariant && (
                    <div className="text-sm text-safety-green-600">{selectedVariant.name}</div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitBulkOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkOrderForm.companyName}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkOrderForm.contactName}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={bulkOrderForm.email}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={bulkOrderForm.phone}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Quantity Needed *
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkOrderForm.quantity}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g., 100-500 units"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Timeline
                  </label>
                  <select
                    value={bulkOrderForm.timeline}
                    onChange={(e) => setBulkOrderForm(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
                  >
                    <option value="">Select timeline</option>
                    <option value="ASAP">ASAP</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2-3 months">2-3 months</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={bulkOrderForm.message}
                  onChange={(e) => setBulkOrderForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Any special requirements, customization needs, or questions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safety-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkOrderModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBulkOrder}
                  className="flex-1 bg-safety-green-600 hover:bg-safety-green-700"
                >
                  {isSubmittingBulkOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Inline Editor - Only for Admins */}
      {isAdmin && (
        <ProductInlineEditor
          product={product}
          isOpen={showEditDrawer}
          onClose={() => setShowEditDrawer(false)}
        />
      )}
    </div>
  );
}
