import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Building2,
  FileText,
  DollarSign,
  Truck,
  Award,
  CheckCircle2,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  Wrench,
  Shield,
  Globe,
  Star,
  BadgeCheck
} from 'lucide-react';

export const metadata = {
  title: 'GSA MAS Contracts | ADA Supply - Federal Government Purchasing',
  description: 'ADA Supply is a GSA Schedule holder (GS-21F-0086U). Streamlined procurement for federal agencies with TAA/BAA compliant products, competitive pricing, and dedicated government support.',
};

export default function GSAContractPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Building2 className="w-8 h-8" />
                </div>
                <span className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm">
                  GSA Contract Holder
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                GSA MAS Contracts
              </h1>
              <p className="text-xl text-blue-100 mb-6 max-w-2xl">
                Streamlined access to high-quality safety and facility products tailored to government needs.
                Competitive pricing, compliance with federal standards, and reliable solutions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signup?type=gsa">
                  <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold">
                    Create GSA Account
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                    Contact GSA Team
                  </Button>
                </Link>
              </div>
            </div>

            {/* GSA Logo / Badge */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-blue-900 font-bold text-lg">GSA Approved</div>
                  <div className="text-gray-600 text-sm">Multiple Award Schedule</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Contract Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-white" />
                <h2 className="text-2xl font-bold text-white">Contract Information</h2>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium mb-1">Contract Number</div>
                  <div className="text-xl font-bold text-blue-900">GS-21F-0086U</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium mb-1">Schedule</div>
                  <div className="text-xl font-bold text-blue-900">51V (MAS)</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium mb-1">Contract Type</div>
                  <div className="text-xl font-bold text-blue-900">5-Year IDIQ</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                  <div className="text-sm text-blue-600 font-medium mb-1">Status</div>
                  <div className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Active
                  </div>
                </div>
              </div>

              {/* TAA/BAA Badge */}
              <div className="mt-6 flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">TAA/BAA Compliant Products</div>
                  <div className="text-sm text-gray-600">All products meet Trade Agreements Act and Buy American Act requirements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose ADA Supply */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
              <Star className="w-7 h-7 text-yellow-500" />
              Why Choose ADA Supply?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">50+ Years Collective Experience</h3>
                  <p className="text-gray-600 text-sm">
                    Our team of prior Military Personnel and Government Contractors brings decades of experience in researching and developing solutions for government needs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Custom Kits & Programs</h3>
                  <p className="text-gray-600 text-sm">
                    We develop custom kits specifically for Government & Military vehicle maintenance operations and specialized applications.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Pre-Negotiated Pricing</h3>
                  <p className="text-gray-600 text-sm">
                    Competitive, GSA-negotiated pricing on all products. No lengthy bidding processes required.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Full Compliance</h3>
                  <p className="text-gray-600 text-sm">
                    All products meet or exceed ANSI, OSHA, NIOSH, and federal safety standards with complete documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Terms */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 p-6">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-white" />
                <h2 className="text-2xl font-bold text-white">Shipping Terms</h2>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-safety-green-600" />
                    <h3 className="font-bold text-black">Continental US</h3>
                  </div>
                  <div className="bg-safety-green-50 text-safety-green-800 font-semibold px-4 py-2 rounded-lg inline-block mb-3">
                    FOB Origin
                  </div>
                  <p className="text-gray-600 text-sm">
                    Free freight within the 48 contiguous states and the District of Columbia.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-black">OCONUS & Territories</h3>
                  </div>
                  <div className="bg-blue-50 text-blue-800 font-semibold px-4 py-2 rounded-lg inline-block mb-3">
                    FOB Origin – Prepay/Add
                  </div>
                  <p className="text-gray-600 text-sm">
                    Alaska, Hawaii, Puerto Rico, US territories, and all OCONUS locations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                <Package className="w-7 h-7 text-safety-green-600" />
                Available Product Categories
              </h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/categories/safety-work-wear" className="group">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-safety-green-500 hover:shadow-md transition-all">
                    <Shield className="w-8 h-8 text-safety-green-600 mb-3" />
                    <h3 className="font-bold text-black group-hover:text-safety-green-600 transition-colors">Safety & Work Wear</h3>
                    <p className="text-sm text-gray-600 mt-1">PPE, hi-vis, gloves, boots</p>
                  </div>
                </Link>

                <Link href="/categories/building-materials" className="group">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-safety-green-500 hover:shadow-md transition-all">
                    <Building2 className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-bold text-black group-hover:text-safety-green-600 transition-colors">Building Materials</h3>
                    <p className="text-sm text-gray-600 mt-1">Construction supplies</p>
                  </div>
                </Link>

                <Link href="/categories/material-handling" className="group">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-safety-green-500 hover:shadow-md transition-all">
                    <Package className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-bold text-black group-hover:text-safety-green-600 transition-colors">Material Handling</h3>
                    <p className="text-sm text-gray-600 mt-1">Storage, transport equipment</p>
                  </div>
                </Link>

                <Link href="/categories/plumbing-pumps" className="group">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-safety-green-500 hover:shadow-md transition-all">
                    <Wrench className="w-8 h-8 text-orange-600 mb-3" />
                    <h3 className="font-bold text-black group-hover:text-safety-green-600 transition-colors">Plumbing & Pumps</h3>
                    <p className="text-sm text-gray-600 mt-1">Plumbing supplies, pumps</p>
                  </div>
                </Link>
              </div>

              <div className="mt-6 text-center">
                <Link href="/products?taaApproved=true">
                  <Button variant="outline" className="border-safety-green-600 text-safety-green-600 hover:bg-safety-green-50">
                    Browse All TAA/BAA Approved Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Who Can Purchase */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Who Can Purchase Through GSA?</h2>
            </div>
            <div className="p-8">
              <p className="text-gray-600 mb-6">
                The following organizations are authorized to purchase through our GSA contract:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Federal Agencies', desc: 'All executive branch departments and independent agencies' },
                  { title: 'Military Installations', desc: 'Department of Defense and all military branches' },
                  { title: 'State Governments', desc: 'State agencies with participating agreements' },
                  { title: 'Local Governments', desc: 'Cities, counties, and municipalities' },
                  { title: 'Educational Institutions', desc: 'Public schools, colleges, universities' },
                  { title: 'Tribal Governments', desc: 'Federally recognized tribal organizations' },
                  { title: 'Non-Profit Organizations', desc: 'Qualified 501(c)(3) organizations' },
                  { title: 'Government Contractors', desc: 'Contractors on federal projects' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-black text-sm">{item.title}</h3>
                      <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How to Order */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">How to Order</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: 1, title: 'Create a GSA Account', desc: 'Register on our website and select "GSA Account" during signup. Provide your agency information.' },
                  { step: 2, title: 'Browse GSA Products', desc: 'All products display GSA contract pricing when logged into a verified GSA account.' },
                  { step: 3, title: 'Place Your Order', desc: 'Add items to cart and checkout with your contract information and purchase order details.' },
                  { step: 4, title: 'Receive Documentation', desc: 'All orders include GSA-compliant invoices, packing lists, and certification documents.' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-black mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div id="contact" className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white rounded-xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h3 className="text-3xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-blue-200 text-lg">
                Our GSA specialists are here to help with your government procurement needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <Phone className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <h4 className="font-semibold mb-2">Phone</h4>
                <a href="tel:+14783298896" className="text-xl font-bold text-white hover:text-yellow-400 transition-colors">
                  (478) 329-8896
                </a>
                <p className="text-sm text-blue-200 mt-2">Press 2 for GSA Sales</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <h4 className="font-semibold mb-2">Email</h4>
                <a href="mailto:info@adasupply.com" className="text-lg font-bold text-white hover:text-yellow-400 transition-colors">
                  info@adasupply.com
                </a>
                <p className="text-sm text-blue-200 mt-2">Response within 24 hours</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <h4 className="font-semibold mb-2">Address</h4>
                <p className="text-white">205 Old Perry Rd.</p>
                <p className="text-white">Bonaire, GA 31005</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-center justify-center gap-3 mb-8 text-blue-200">
              <Clock className="w-5 h-5" />
              <span>Monday - Friday: 8:00 AM - 5:00 PM EST</span>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth/signup?type=gsa">
                <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-8">
                  Create GSA Account
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 px-8">
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>

          {/* External Links */}
          <div className="text-center text-sm text-gray-500">
            <p>
              View our products on{' '}
              <a
                href="https://www.gsaadvantage.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GSA Advantage
              </a>
              {' '}| Contract Number: GS-21F-0086U
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
