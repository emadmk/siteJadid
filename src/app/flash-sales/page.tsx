'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const response = await fetch('/api/flash-sales/active');
      const data = await response.json();
      setFlashSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Flash Sales</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🔥 Flash Sales - Limited Time Offers!</h1>

      {flashSales.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No active flash sales at the moment.</p>
          <p className="text-gray-500 mt-2">Check back soon for amazing deals!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {flashSales.map((sale) => (
            <div key={sale.id} className="border rounded-lg p-6 bg-white shadow-md">
              {sale.bannerImage && (
                <img
                  src={sale.bannerImage}
                  alt={sale.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{sale.name}</h2>
                  {sale.description && (
                    <p className="text-gray-600 mt-2">{sale.description}</p>
                  )}
                </div>
                {sale.badgeText && (
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                    {sale.badgeText}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-lg font-semibold text-red-600">
                  ⏰ {getTimeRemaining(sale.endsAt)}
                </p>
                <p className="text-sm text-gray-500">
                  Ends: {new Date(sale.endsAt).toLocaleString()}
                </p>
              </div>

              {sale.items && sale.items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {sale.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm line-through text-gray-500">
                            ${Number(item.originalPrice).toFixed(2)}
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            ${Number(item.salePrice).toFixed(2)}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Save {Number(item.discountPercent).toFixed(0)}%
                        </span>
                      </div>
                      {item.maxQuantity && (
                        <p className="text-xs text-gray-500 mt-2">
                          Only {item.maxQuantity - item.soldQuantity} left!
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/flash-sales/${sale.slug}`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View All Deals ({sale.items?.length || 0})
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
