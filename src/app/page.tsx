import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Users, Award, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Enterprise E-commerce Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Comprehensive B2B, B2C, and GSA e-commerce solution with advanced features
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="gap-2">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ShoppingBag className="w-10 h-10 text-blue-600" />}
              title="B2C Shopping"
              description="Consumer-friendly shopping experience with cart, wishlist, and checkout"
            />
            <FeatureCard
              icon={<Users className="w-10 h-10 text-green-600" />}
              title="B2B Platform"
              description="Wholesale pricing, bulk orders, and credit terms for businesses"
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-purple-600" />}
              title="GSA Advantage"
              description="Government contract pricing and compliance features"
            />
            <FeatureCard
              icon={<Award className="w-10 h-10 text-orange-600" />}
              title="Loyalty Program"
              description="Multi-tier rewards program with exclusive benefits"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CategoryCard
              title="Electronics"
              description="Computers, laptops, and accessories"
              href="/products?category=electronics"
            />
            <CategoryCard
              title="Office Furniture"
              description="Desks, chairs, and office essentials"
              href="/products?category=office-furniture"
            />
            <CategoryCard
              title="Office Supplies"
              description="Stationery, printers, and supplies"
              href="/products?category=office-supplies"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers and businesses
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Enterprise E-commerce</h3>
              <p className="text-gray-400">
                Professional B2B/B2C platform with advanced features
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products">Products</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/orders">Orders</Link></li>
                <li><Link href="/profile">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/shipping">Shipping Info</Link></li>
                <li><Link href="/returns">Returns</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Enterprise E-commerce Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function CategoryCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <span className="text-blue-600 font-medium inline-flex items-center gap-1">
          Browse <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
