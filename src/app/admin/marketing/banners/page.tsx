'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Calendar,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Upload,
  Monitor,
  Smartphone,
  Clock,
  Search,
} from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  image: string;
  link: string;
  linkType: 'url' | 'category' | 'product';
  linkTarget: string;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  order: number;
  slideDuration: number;
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const desktopFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [mobilePreview, setMobilePreview] = useState<string>('');

  // Category/Product/Brand search
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link: '',
    linkType: 'url' as 'url' | 'category' | 'product' | 'brand',
    linkTarget: '',
    position: 'hero' as Banner['position'],
    isActive: true,
    startDate: '',
    endDate: '',
    slideDuration: 5,
    desktopImage: null as File | null,
    mobileImage: null as File | null,
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/storefront/products?search=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setProducts((data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        })));
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');
    setMessage(null);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('subtitle', formData.subtitle);
      submitData.append('link', formData.link);
      submitData.append('linkType', formData.linkType);
      submitData.append('linkTarget', formData.linkTarget);
      submitData.append('position', formData.position);
      submitData.append('isActive', String(formData.isActive));
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('slideDuration', String(formData.slideDuration));

      if (formData.desktopImage) {
        submitData.append('desktopImage', formData.desktopImage);
      }
      if (formData.mobileImage) {
        submitData.append('mobileImage', formData.mobileImage);
      }

      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: submitData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: editingBanner ? 'Banner updated successfully' : 'Banner created successfully',
        });
        setShowModal(false);
        resetForm();
        fetchBanners();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save banner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    setActionLoading(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== id));
        setMessage({ type: 'success', text: 'Banner deleted successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete banner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBannerStatus = async (banner: Banner) => {
    setActionLoading(banner.id);

    try {
      const formData = new FormData();
      formData.append('isActive', String(!banner.isActive));

      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (res.ok) {
        setBanners(prev =>
          prev.map(b => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      linkType: banner.linkType as any || 'url',
      linkTarget: banner.linkTarget || '',
      position: banner.position || 'hero',
      isActive: banner.isActive,
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      slideDuration: banner.slideDuration || 5,
      desktopImage: null,
      mobileImage: null,
    });
    setDesktopPreview(banner.desktopImage || banner.image || '');
    setMobilePreview(banner.mobileImage || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      link: '',
      linkType: 'url',
      linkTarget: '',
      position: 'hero',
      isActive: true,
      startDate: '',
      endDate: '',
      slideDuration: 5,
      desktopImage: null,
      mobileImage: null,
    });
    setDesktopPreview('');
    setMobilePreview('');
    setProductSearch('');
    setProducts([]);
    if (desktopFileRef.current) desktopFileRef.current.value = '';
    if (mobileFileRef.current) mobileFileRef.current.value = '';
  };

  const filteredBanners = banners.filter(banner => {
    if (filter === 'all') return true;
    if (filter === 'active') return banner.isActive;
    if (filter === 'inactive') return !banner.isActive;
    return banner.position === filter;
  });

  const stats = {
    total: banners.length,
    active: banners.filter(b => b.isActive).length,
    hero: banners.filter(b => b.position === 'hero').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banner Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage promotional banners for the hero slider
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Banners</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Hero Banners</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.hero}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Banners Grid */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No banners found. Click &quot;Add Banner&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map(banner => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Desktop Banner Preview */}
              <div className="relative aspect-[16/6] bg-gray-100">
                {(banner.desktopImage || banner.image) ? (
                  <img
                    src={banner.desktopImage || banner.image}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-900/70 text-white flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Desktop
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Slide duration badge */}
                <div className="absolute bottom-2 right-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-black/50 text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {banner.slideDuration || 5}s
                  </span>
                </div>
              </div>

              {/* Mobile Banner Preview (small) */}
              {banner.mobileImage && banner.mobileImage !== banner.desktopImage && (
                <div className="relative h-16 bg-gray-50 border-t border-gray-100">
                  <img
                    src={banner.mobileImage}
                    alt="Mobile"
                    className="h-full mx-auto object-contain"
                  />
                  <span className="absolute top-1 left-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-900/70 text-white flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" /> Mobile
                  </span>
                </div>
              )}

              {/* Banner Info */}
              <div className="p-4">
                {banner.title && (
                  <h3 className="font-semibold text-gray-900 text-sm">{banner.title}</h3>
                )}
                {banner.link && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate">{banner.link}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    Order: {banner.order}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBannerStatus(banner)}
                      disabled={actionLoading === banner.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        banner.isActive
                          ? 'text-yellow-600 hover:bg-yellow-100'
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={banner.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {actionLoading === banner.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : banner.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      disabled={actionLoading === banner.id}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBanner ? 'Edit Banner' : 'Add Banner'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Desktop Image Upload */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Monitor className="w-4 h-4" />
                    Desktop Banner Image *
                  </label>
                  <div
                    onClick={() => desktopFileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {desktopPreview ? (
                      <div className="relative aspect-[16/6]">
                        <img
                          src={desktopPreview}
                          alt="Desktop Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setDesktopPreview('');
                            setFormData(prev => ({ ...prev, desktopImage: null }));
                            if (desktopFileRef.current) desktopFileRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Upload desktop banner</p>
                        <p className="text-xs text-gray-400 mt-1">Recommended: 1920 x 500px</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={desktopFileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({ ...prev, desktopImage: file }));
                        setDesktopPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {/* Mobile Image Upload */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile Banner Image
                    <span className="text-xs text-gray-400 font-normal">(optional - falls back to desktop)</span>
                  </label>
                  <div
                    onClick={() => mobileFileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {mobilePreview ? (
                      <div className="relative aspect-[16/9] max-w-[300px] mx-auto">
                        <img
                          src={mobilePreview}
                          alt="Mobile Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setMobilePreview('');
                            setFormData(prev => ({ ...prev, mobileImage: null }));
                            if (mobileFileRef.current) mobileFileRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-500">Upload mobile banner</p>
                        <p className="text-xs text-gray-400 mt-1">Recommended: 768 x 400px</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={mobileFileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({ ...prev, mobileImage: file }));
                        setMobilePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {/* Link Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link To
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[
                      { value: 'url', label: 'Custom URL' },
                      { value: 'category', label: 'Category' },
                      { value: 'product', label: 'Product' },
                      { value: 'brand', label: 'Brand' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, linkType: opt.value as any, linkTarget: '', link: '' }));
                          setProductSearch('');
                          setProducts([]);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.linkType === opt.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* URL Input */}
                  {formData.linkType === 'url' && (
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.link}
                        onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://... or /page-path"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      />
                    </div>
                  )}

                  {/* Category Select */}
                  {formData.linkType === 'category' && (
                    <select
                      value={formData.linkTarget}
                      onChange={e => setFormData(prev => ({ ...prev, linkTarget: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.parentId ? '  └─ ' : ''}{cat.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Product Search */}
                  {formData.linkType === 'product' && (
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={e => {
                            setProductSearch(e.target.value);
                            searchProducts(e.target.value);
                          }}
                          placeholder="Search products..."
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        />
                        {searchingProducts && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      {formData.linkTarget && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
                          <span>Selected: {formData.linkTarget}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, linkTarget: '' }));
                              setProductSearch('');
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {products.length > 0 && !formData.linkTarget && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {products.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, linkTarget: p.slug }));
                                setProductSearch(p.name);
                                setProducts([]);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-b border-gray-100 last:border-0"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Brand Select */}
                  {formData.linkType === 'brand' && (
                    <select
                      value={formData.linkTarget}
                      onChange={e => setFormData(prev => ({ ...prev, linkTarget: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.slug}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Slide Duration */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4" />
                    Slide Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={formData.slideDuration}
                    onChange={e => setFormData(prev => ({ ...prev, slideDuration: parseInt(e.target.value) || 5 }))}
                    className="w-32 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                {/* Title (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-xs text-gray-400 font-normal">(optional - for internal reference)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Spring Sale Banner"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={actionLoading === 'submit'}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {actionLoading === 'submit' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {editingBanner ? 'Update Banner' : 'Create Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
