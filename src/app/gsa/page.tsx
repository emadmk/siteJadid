import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Building2,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  Wrench,
  Shield,
  ExternalLink,
  Cog,
  Tag,
  Box,
  Hammer,
} from 'lucide-react';

export const metadata = {
  title: 'GSA MAS Contracts | ADA Supply - Federal Government Purchasing',
  description: 'ADA Supply is a GSA Schedule holder (GS-21F-0086U) and DLA BPA contractor. Streamlined procurement for federal agencies with TAA/BAA compliant products.',
};

export default function GSAContractPage() {
  // Services list
  const services = [
    'Custom Fabrication & Kitting',
    'Software/Engineering VAR',
    'Custom Manufacturing',
    'Private Labeling',
    'Custom Safety Kit Assembly',
    'Custom Packaging, Marking, & Fulfillment',
    'Maintenance, Repair, & Operations',
  ];

  // Products list
  const products = [
    'Abrasive/Cutting',
    'Air Duct Systems',
    'Electrical/Lighting',
    'Embroidery/Screen Printing',
    'Emergency Response & Rescue',
    'Fasteners',
    'Hand Tools & Power Tools',
    'Hardware/Hydraulics',
    'Industrial Clothing, Uniforms, and Shoes',
    'Instrumentation',
    'Janitorial/Industrial/Maintenance',
    'Lubrication',
    'Medical & Occupational PPE',
    'Office Products',
    'Power/Pneumatic',
    'Precision Tools',
    'Safety',
    'Signs & Labels',
    'Tapes/Adhesives',
    'Welding',
  ];

  // Major accounts
  const majorAccounts = [
    'NDOT Nevada Dept. of Transportation',
    'GSA/FAS SW Support Center',
    'National Institute of Health',
    'DOD GCSS Army',
    'DLA',
    'City of San Diego',
    'Robins AFB, Georgia',
  ];

  // NAICS codes
  const naicsCodes = [
    '423490', '423610', '424120', '423440', '423720', '424610',
    '423840', '424340', '423140', '423460', '423730', '424690',
    '424130', '423450', '423210', '423690', '423860', '424720',
    '423390', '423830', '423420', '423710', '423910', '424950',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section with Soldier Image */}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/imagesite/gsa.jpg"
            alt="Military Personnel"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Title and Tunnel to Towers */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-safety-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Shield className="w-4 h-4" />
                GSA Contract Holder
              </div>

              {/* Title with Badge */}
              <div className="flex items-start gap-6 mb-4">
                <Image
                  src="/images/imagesite/badge copy.png"
                  alt="25 Years Badge"
                  width={120}
                  height={120}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                    <span className="text-safety-green-400">GSA MAS</span>
                    <br />
                    CONTRACTOR
                  </h1>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xl md:text-2xl text-gray-300 font-light italic mb-8">
                Serving the government for over 25 years
              </p>

              {/* Partner Badges - Larger and more attractive */}
              <div className="flex flex-wrap gap-4 mt-6">
                {/* US Small Business */}
                <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[168px] h-[108px] overflow-hidden">
                  <Image
                    src="/images/imagesite/ussmall.png"
                    alt="US Small Business"
                    width={144}
                    height={90}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>

                {/* Partner Image 2 */}
                <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[168px] h-[108px] overflow-hidden">
                  <Image
                    src="/images/imagesite/2.jpeg"
                    alt="Partner Certification"
                    width={144}
                    height={90}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>

                {/* Tunnel to Towers */}
                <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[168px] h-[108px] overflow-hidden">
                  <Image
                    src="/images/imagesite/t2t.jpg"
                    alt="Tunnel to Towers Foundation"
                    width={144}
                    height={90}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Contract Info */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-center">
                <h2 className="text-2xl font-bold text-safety-green-400">SCHEDULE 51V</h2>
              </div>

              {/* Contract Numbers */}
              <div className="p-6 border-b border-gray-200">
                <div className="space-y-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">GSA MAS Contract#</div>
                    <div className="text-xl font-bold text-gray-900">GS-21F-0086U</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">DLA BPA Contract#</div>
                    <div className="text-xl font-bold text-gray-900">SP3300-20-A-5011</div>
                  </div>
                </div>
              </div>

              {/* Green Divider */}
              <div className="h-1 bg-safety-green-500" />

              {/* Identifiers */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">CAGE Code</div>
                    <div className="text-lg font-bold text-gray-900">1J2Y1</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">EIN</div>
                    <div className="text-lg font-bold text-gray-900">58-2440650</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">UEI</div>
                    <div className="text-lg font-bold text-gray-900">JAHKAMJPCCE7</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Section */}
          <div className="bg-safety-green-600 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-wider">SERVICES</h2>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-200 flex-shrink-0" />
                    <span className="text-sm font-medium uppercase tracking-wide">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg border-2 border-safety-green-500">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-safety-green-600 text-center mb-6 tracking-wider">PRODUCTS</h2>
              <div className="grid grid-cols-2 gap-2">
                {products.map((product, index) => (
                  <div key={index} className="text-sm text-safety-green-700 font-medium uppercase tracking-wide">
                    {product}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shop on GSA Button */}
        <div className="mt-8 flex justify-center">
          <a
            href="https://www.gsaadvantage.gov/advantage/ws/search/advantage_search?q=0:2GS21F0086U&db=0&searchType=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl px-12 py-4 rounded-lg transition-colors shadow-lg"
          >
            SHOP ON GSA
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Major Accounts & NAICS Codes */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Major Accounts */}
          <div className="bg-safety-green-600 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-wider">MAJOR ACCOUNTS</h2>
              <div className="grid grid-cols-2 gap-4">
                {majorAccounts.map((account, index) => (
                  <div key={index} className="flex items-start gap-2 text-white">
                    <span className="text-safety-green-300">-</span>
                    <span className="text-sm font-medium">{account}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NAICS Codes */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-6 tracking-wider">NAICS CODES</h2>
              <div className="grid grid-cols-6 gap-2">
                {naicsCodes.map((code, index) => (
                  <div
                    key={index}
                    className="text-center py-2 px-1 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Who Can Purchase */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-safety-green-600" />
              Who Can Purchase
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green-600 mt-0.5 flex-shrink-0" />
                Federal Agencies
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green-600 mt-0.5 flex-shrink-0" />
                Military Installations
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green-600 mt-0.5 flex-shrink-0" />
                State & Local Governments
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green-600 mt-0.5 flex-shrink-0" />
                Educational Institutions
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green-600 mt-0.5 flex-shrink-0" />
                Government Contractors
              </li>
            </ul>
          </div>

          {/* Shipping Terms */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-safety-green-600" />
              Shipping Terms
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <div className="font-semibold text-gray-900">Continental US (48 States + DC)</div>
                <div className="mt-1 bg-safety-green-50 text-safety-green-700 px-3 py-1 rounded inline-block font-medium">
                  FOB Origin
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">OCONUS & Territories</div>
                <div className="mt-1 bg-blue-50 text-blue-700 px-3 py-1 rounded inline-block font-medium">
                  FOB Origin – Prepay/Add
                </div>
              </div>
            </div>
          </div>

          {/* TAA/BAA Compliance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-safety-green-600" />
              Compliance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">TAA/BAA Approved</span>
              </div>
              <p className="text-sm text-gray-600">
                All products meet Trade Agreements Act and Buy American Act requirements for government procurement.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-gray-400">
              Contact our GSA team for quotes, custom orders, or procurement assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Phone className="w-8 h-8 mx-auto mb-3 text-safety-green-400" />
              <h4 className="font-semibold mb-2">Phone</h4>
              <a href="tel:+14783298896" className="text-xl font-bold text-white hover:text-safety-green-400 transition-colors">
                (478) 329-8896
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3 text-safety-green-400" />
              <h4 className="font-semibold mb-2">Email</h4>
              <a href="mailto:info@adasupply.com" className="text-lg font-bold text-white hover:text-safety-green-400 transition-colors">
                info@adasupply.com
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-safety-green-400" />
              <h4 className="font-semibold mb-2">Address</h4>
              <p className="text-white">205 Old Perry Rd.</p>
              <p className="text-white">Bonaire, GA 31005</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8 text-gray-400">
            <Clock className="w-5 h-5" />
            <span>Monday - Friday: 8:00 AM - 5:00 PM EST</span>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/signup?type=gsa">
              <Button size="lg" className="bg-safety-green-600 hover:bg-safety-green-700 text-white font-bold px-8">
                Create GSA Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8">
                Request a Quote
              </Button>
            </Link>
            <Link href="/products?taaApproved=true">
              <Button size="lg" variant="outline" className="border-safety-green-400 text-safety-green-400 hover:bg-safety-green-400 hover:text-white px-8">
                Browse TAA/BAA Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            View our products on{' '}
            <a
              href="https://www.gsaadvantage.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-safety-green-600 hover:underline font-medium"
            >
              GSA Advantage
            </a>
            {' '}|{' '}
            <a
              href="https://fedmall.mil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-safety-green-600 hover:underline font-medium"
            >
              FedMall
            </a>
            {' '}| Contract: GS-21F-0086U
          </p>
        </div>
      </div>
    </div>
  );
}
