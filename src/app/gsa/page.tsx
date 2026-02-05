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
  title: 'GSA MAS Contracts | ADA Supplies - Federal Government Purchasing',
  description: 'ADA Supplies is a GSA Schedule holder (GS-21F-0086U). Streamlined procurement for federal agencies with TAA/BAA compliant products.',
};

export default function GSAContractPage() {
  // Services list - Updated
  const services = [
    'Custom Fabrication & Kitting',
    'Software/Engineering VAR',
    'Custom Manufacturing',
  ];

  // Products list - Updated (removed crossed out items)
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
    'Janitorial/Industrial/Maintenance',
    'Medical & Occupational PPE',
    'Power/Pneumatic',
    'Safety',
    'Tapes/Adhesives',
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

  // NAICS codes - Updated (removed crossed out codes)
  const naicsCodes = [
    '423490', '423610', '424120', '423720', '424610',
    '423840', '424340', '423140', '423730', '424690',
    '424130', '423450', '423210', '423860', '424720',
    '423390', '423830', '423420', '423910', '424950',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section - Centered Design */}
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
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/60 to-gray-900/80" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Centered Content */}
          <div className="flex flex-col items-center text-center text-white">
            {/* GSA Contract Holder Badge */}
            <div className="inline-flex items-center gap-2 bg-safety-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-8">
              <Shield className="w-4 h-4" />
              GSA Contract Holder
            </div>

            {/* Main Title - Centered and Large */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span className="text-safety-green-400">GSA MAS</span>
              <br />
              <span className="text-white">CONTRACTOR</span>
            </h1>

            {/* 25 Years Badge */}
            <div className="mb-4">
              <Image
                src="/images/imagesite/badge copy.png"
                alt="25 Years Badge"
                width={140}
                height={140}
                className="object-contain"
              />
            </div>

            {/* Tagline below badge */}
            <p className="text-xl md:text-2xl text-gray-300 font-light italic mb-10">
              Serving the government for over 25 years
            </p>

            {/* Partner Logos Row */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {/* WOSB */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/1.jpeg"
                  alt="WOSB Certified"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>

              {/* FedMall */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/02.jpg"
                  alt="FedMall"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>

              {/* GSA */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/01.jpg"
                  alt="GSA"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>

              {/* AbilityOne & MRO */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/03.png"
                  alt="AbilityOne & MRO"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>

              {/* HubZone */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/2.jpeg"
                  alt="HubZone Certified"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>

              {/* Tunnel to Towers */}
              <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center min-w-[120px] h-[80px] overflow-hidden">
                <Image
                  src="/images/imagesite/t2t.jpg"
                  alt="Tunnel to Towers Foundation"
                  width={100}
                  height={60}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            </div>

            {/* Shop on GSA Button */}
            <a
              href="https://www.gsaadvantage.gov/advantage/ws/search/advantage_search?q=0:2GS21F0086U&db=0&searchType=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-safety-green-600 hover:bg-safety-green-700 text-white font-bold text-xl px-12 py-4 rounded-lg transition-colors shadow-lg"
            >
              SHOP ON GSA
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Contract Info Bar - Single Line */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-center">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">SCHEDULE</div>
              <div className="text-lg font-bold text-safety-green-600">51V</div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden md:block" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">GSA MAS Contract#</div>
              <div className="text-lg font-bold text-gray-900">GS-21F-0086U</div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden md:block" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">CAGE Code</div>
              <div className="text-lg font-bold text-gray-900">1J2Y1</div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden md:block" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">EIN</div>
              <div className="text-lg font-bold text-gray-900">58-2440650</div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden md:block" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">UEI</div>
              <div className="text-lg font-bold text-gray-900">JAHKAMJPCCE7</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
