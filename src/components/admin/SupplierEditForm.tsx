'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  status: SupplierStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierEditFormProps {
  supplier: Supplier;
}

export default function SupplierEditForm({ supplier }: SupplierEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: supplier.name,
    code: supplier.code,
    email: supplier.email || '',
    phone: supplier.phone || '',
    website: supplier.website || '',
    address: supplier.address || '',
    city: supplier.city || '',
    state: supplier.state || '',
    country: supplier.country || '',
    zipCode: supplier.zipCode || '',
    taxId: supplier.taxId || '',
    businessLicense: supplier.businessLicense || '',
    rating: supplier.rating ? Number(supplier.rating) : '',
    onTimeDeliveryRate: supplier.onTimeDeliveryRate
      ? Number(supplier.onTimeDeliveryRate)
      : '',
    qualityRating: supplier.qualityRating ? Number(supplier.qualityRating) : '',
    paymentTerms: supplier.paymentTerms,
    currency: supplier.currency,
    status: supplier.status,
    notes: supplier.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update supplier');
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert(error instanceof Error ? error.message : 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this supplier? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete supplier');
      }

      router.push('/admin/suppliers');
      router.refresh();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete supplier');
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Name:</span>{' '}
            {supplier.name}
          </div>
          <div>
            <span className="font-medium text-gray-600">Code:</span>{' '}
            {supplier.code}
          </div>
          <div>
            <span className="font-medium text-gray-600">Email:</span>{' '}
            {supplier.email || 'N/A'}
          </div>
          <div>
            <span className="font-medium text-gray-600">Phone:</span>{' '}
            {supplier.phone || 'N/A'}
          </div>
          <div>
            <span className="font-medium text-gray-600">Website:</span>{' '}
            {supplier.website || 'N/A'}
          </div>
          <div>
            <span className="font-medium text-gray-600">Payment Terms:</span> Net{' '}
            {supplier.paymentTerms} days
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
          >
            Edit Supplier
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delete Supplier
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Code *
          </label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Zip Code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) =>
              setFormData({ ...formData, zipCode: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tax ID
          </label>
          <input
            type="text"
            value={formData.taxId}
            onChange={(e) =>
              setFormData({ ...formData, taxId: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business License
          </label>
          <input
            type="text"
            value={formData.businessLicense}
            onChange={(e) =>
              setFormData({ ...formData, businessLicense: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Terms (days)
          </label>
          <input
            type="number"
            value={formData.paymentTerms}
            onChange={(e) =>
              setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as SupplierStatus,
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          >
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-safety-green-500 focus:ring-safety-green-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={loading}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
