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
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
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
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    basePrice: number;
    salePrice: number | null;
    wholesalePrice: number | null;
    gsaPrice: number | null;
    costPrice: number | null;
    images: string[];
    isFeatured: boolean;
    isBestSeller: boolean;
    isNewArrival: boolean;
    stockQuantity: number;
    lowStockThreshold: number | null;
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

  const images = product.images || [];
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
            <Link href="/products" className="text-gray-600 hover:text-safety-green-600">
              Products
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
                />
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-black">
                  ${Number(currentPrice).toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    ${Number(currentBasePrice).toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded">
                    Save ${(currentBasePrice - currentPrice).toFixed(2)}
                  </span>
                )}
              </div>

              {/* B2B Pricing */}
              {(currentWholesalePrice || currentGsaPrice) && (
                <div className="flex flex-wrap gap-4 pt-2">
                  {currentWholesalePrice && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      <Building2 className="w-4 h-4" />
                      B2B: ${Number(currentWholesalePrice).toFixed(2)}
                    </div>
                  )}
                  {currentGsaPrice && (
                    <div className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                      <FileText className="w-4 h-4" />
                      GSA: ${Number(currentGsaPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Tiered Pricing */}
              {product.tieredPrices.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-black mb-2">Volume Discounts</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {product.tieredPrices.map((tier) => (
                      <div key={tier.id} className="bg-white rounded px-3 py-2 text-center">
                        <div className="font-medium text-black">
                          {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'}
                        </div>
                        <div className="text-safety-green-600 font-semibold">
                          ${Number(tier.price).toFixed(2)}/ea
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

            {/* Request Quote */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-black text-black hover:bg-black hover:text-white"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Request B2B Quote
            </Button>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-black">Free Shipping</div>
                  <div className="text-xs text-gray-600">On orders over $99</div>
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
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
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
