import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Award, Truck, HeadphonesIcon, HardHat, Eye, Volume2, Wind } from 'lucide-react';
import { db } from '@/lib/db';

async function getCategories() {
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  return categories;
}

async function getFeaturedProducts() {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      stockQuantity: {
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      images: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    take: 8,
    orderBy: {
      createdAt: 'desc',
    },
  });
  return products;
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-safety-green-50 to-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-safety-green-100 text-safety-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              ANSI & OSHA Certified Equipment
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-black mb-6">
              Professional Safety Equipment
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Premium protective gear for workplace safety. Trusted by professionals across America.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  Shop Safety Gear <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                  B2B Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-safety-green-300">500+</div>
              <div className="text-sm text-gray-300 mt-1">Safety Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-safety-green-300">ANSI</div>
              <div className="text-sm text-gray-300 mt-1">Certified Equipment</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-safety-green-300">24/7</div>
              <div className="text-sm text-gray-300 mt-1">Customer Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-safety-green-300">Free</div>
              <div className="text-sm text-gray-300 mt-1">Shipping Over $99</div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our comprehensive selection of safety equipment designed to keep you protected
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                description={category.description || ''}
                href={`/products?category=${category.slug}`}
                image={category.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-black mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Top-rated safety equipment trusted by professionals
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.salePrice || product.basePrice}
                  originalPrice={product.salePrice ? product.basePrice : undefined}
                  image={(product.images as string[])?.[0]}
                  category={product.category?.name}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/products">
                <Button size="lg" variant="outline" className="gap-2 border-black text-black hover:bg-black hover:text-white">
                  View All Products <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your trusted partner in workplace safety
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-10 h-10 text-safety-green-600" />}
              title="ANSI Certified"
              description="All products meet or exceed ANSI/OSHA safety standards"
            />
            <FeatureCard
              icon={<Truck className="w-10 h-10 text-safety-green-600" />}
              title="Fast Shipping"
              description="Free shipping on orders over $99. Same-day dispatch available"
            />
            <FeatureCard
              icon={<Award className="w-10 h-10 text-safety-green-600" />}
              title="Quality Brands"
              description="Premium brands: 3M, Timberland PRO, MSA, Carhartt & more"
            />
            <FeatureCard
              icon={<HeadphonesIcon className="w-10 h-10 text-safety-green-600" />}
              title="Expert Support"
              description="24/7 customer support from safety equipment specialists"
            />
          </div>
        </div>
      </section>

      {/* B2B & GSA Section */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Wholesale & Government Solutions</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Volume discounts, Net 30 terms, and GSA contract pricing available for businesses and government agencies.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-safety-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">B2B Wholesale Pricing</div>
                    <div className="text-gray-400">Volume discounts and Net 30 payment terms</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-safety-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">GSA Contract Pricing</div>
                    <div className="text-gray-400">Government-approved pricing and compliance</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-safety-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">Dedicated Account Manager</div>
                    <div className="text-gray-400">Personal support for your organization</div>
                  </div>
                </li>
              </ul>
              <div className="flex gap-4">
                <Link href="/auth/signup?type=b2b">
                  <Button size="lg" className="bg-safety-green-600 hover:bg-safety-green-700">
                    Apply for B2B Account
                  </Button>
                </Link>
                <Link href="/gsa">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                    GSA Information
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-2xl font-bold mb-4 text-safety-green-300">Request a Quote</h3>
              <p className="text-gray-300 mb-6">
                Get wholesale pricing for bulk orders. Fill out the form and our team will contact you within 24 hours.
              </p>
              <Link href="/contact?type=wholesale">
                <Button size="lg" className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                  Contact Sales Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-safety-green-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Protect Your Team?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of businesses who trust us for their safety equipment needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100 gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-safety-green-700">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold mb-4 text-safety-green-300">SafetyPro Store</h3>
              <p className="text-gray-400 mb-4">
                Your trusted source for professional safety equipment. ANSI certified, OSHA compliant.
              </p>
              <p className="text-gray-500 text-sm">
                Serving businesses and professionals across the United States since 2024.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-safety-green-300">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-safety-green-300 transition-colors">All Products</Link></li>
                <li><Link href="/products?category=safety-footwear" className="hover:text-safety-green-300 transition-colors">Safety Footwear</Link></li>
                <li><Link href="/products?category=head-protection" className="hover:text-safety-green-300 transition-colors">Head Protection</Link></li>
                <li><Link href="/products?category=high-visibility-clothing" className="hover:text-safety-green-300 transition-colors">Hi-Vis Clothing</Link></li>
                <li><Link href="/products?featured=true" className="hover:text-safety-green-300 transition-colors">Featured Items</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-safety-green-300">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-safety-green-300 transition-colors">Dashboard</Link></li>
                <li><Link href="/orders" className="hover:text-safety-green-300 transition-colors">My Orders</Link></li>
                <li><Link href="/profile" className="hover:text-safety-green-300 transition-colors">Profile</Link></li>
                <li><Link href="/cart" className="hover:text-safety-green-300 transition-colors">Shopping Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-safety-green-300">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-safety-green-300 transition-colors">Contact Us</Link></li>
                <li><Link href="/shipping" className="hover:text-safety-green-300 transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-safety-green-300 transition-colors">Returns Policy</Link></li>
                <li><Link href="/faq" className="hover:text-safety-green-300 transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2024 SafetyPro Store. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <Link href="/privacy" className="hover:text-safety-green-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-safety-green-300 transition-colors">Terms of Service</Link>
                <Link href="/compliance" className="hover:text-safety-green-300 transition-colors">Compliance</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-safety-green-300 transition-all hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function CategoryCard({ title, description, href, image }: { title: string; description: string; href: string; image?: string | null }) {
  return (
    <Link href={href}>
      <div className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer h-full">
        {image && (
          <div className="w-full h-40 mb-4 rounded-lg bg-gray-100 overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <h3 className="text-xl font-semibold mb-2 text-black group-hover:text-safety-green-700 transition-colors">{title}</h3>
        <p className="text-gray-600 mb-4 text-sm">{description}</p>
        <span className="text-safety-green-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          Shop Now <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function ProductCard({
  name,
  slug,
  price,
  originalPrice,
  image,
  category
}: {
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
}) {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <Link href={`/products/${slug}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden">
        <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShieldCheck className="w-16 h-16 text-gray-300" />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
        </div>
        <div className="p-4">
          {category && (
            <div className="text-xs text-safety-green-600 font-medium mb-1">{category}</div>
          )}
          <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-black">${price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
