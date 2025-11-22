import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Building2, FileText, DollarSign, Truck, Award, CheckCircle2, Users } from 'lucide-react';

export default function GSAContractPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <Building2 className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">GSA Contract Sales</h1>
              <p className="text-safety-green-100 mt-2">
                Authorized supplier for federal, state, and local government agencies
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* GSA Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-10 h-10 text-safety-green-600" />
              <div>
                <h2 className="text-3xl font-bold text-black">GSA Advantage Partner</h2>
                <p className="text-gray-600 mt-1">Streamlined procurement for government agencies</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              SafetyPro Supply is a proud GSA Schedule holder, providing government agencies with compliant safety equipment at pre-negotiated pricing. Our GSA contract streamlines the procurement process, ensuring you get the safety equipment you need quickly and efficiently.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-2">GSA Schedule Information</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Contract Number:</strong> GS-07F-XXXXX</p>
                    <p><strong>Schedule:</strong> Multiple Award Schedule (MAS)</p>
                    <p><strong>SIN:</strong> 333249 - Safety and Protective Equipment</p>
                    <p><strong>Contract Period:</strong> Valid through December 2028</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">Pre-Negotiated Pricing</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Access competitive, pre-negotiated pricing on all safety equipment. No need for lengthy bidding processes - our GSA contract prices are already negotiated and compliant.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">Fast Delivery</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Expedited processing for government orders. Most orders ship within 24-48 hours. Emergency orders can be accommodated with priority handling.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">Compliant Products</h3>
              </div>
              <p className="text-gray-600 text-sm">
                All products meet or exceed federal safety standards including ANSI, OSHA, and NIOSH requirements. Complete documentation available for all purchases.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">Dedicated Support</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Dedicated GSA account managers to assist with ordering, product selection, and compliance questions. Direct line to our government sales team.
              </p>
            </div>
          </div>

          {/* Who Can Use GSA */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Who Can Purchase Through GSA?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                The following organizations are authorized to purchase through our GSA contract:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Federal Agencies</h3>
                    <p className="text-gray-600 text-sm">All executive branch departments and independent agencies</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Military Installations</h3>
                    <p className="text-gray-600 text-sm">Department of Defense and all military branches</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">State Governments</h3>
                    <p className="text-gray-600 text-sm">State agencies and departments (with participating state agreements)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Local Governments</h3>
                    <p className="text-gray-600 text-sm">Cities, counties, and municipalities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Educational Institutions</h3>
                    <p className="text-gray-600 text-sm">Public schools, colleges, and universities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Tribal Governments</h3>
                    <p className="text-gray-600 text-sm">Federally recognized tribal organizations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Non-Profit Organizations</h3>
                    <p className="text-gray-600 text-sm">Qualified 501(c)(3) organizations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-safety-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-black text-sm">Contractors</h3>
                    <p className="text-gray-600 text-sm">Government contractors working on federal projects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Order */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">How to Order</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Create a GSA Account</h3>
                    <p className="text-gray-600">
                      Register on our website and select "GSA Account" during signup. Provide your agency information and contract authorization.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Browse GSA Products</h3>
                    <p className="text-gray-600">
                      All products display GSA contract pricing when logged into a verified GSA account. Filter by SIN or product category.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Place Your Order</h3>
                    <p className="text-gray-600">
                      Add items to cart and checkout. Provide required contract information and purchase order details. Orders can also be placed via email or phone.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center text-safety-green-700 font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">Receive Documentation</h3>
                    <p className="text-gray-600">
                      All orders include complete GSA-compliant documentation including invoices, packing lists, and certification documents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Available Product Categories</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Head Protection</h3>
                  <p className="text-sm text-gray-600">Hard hats, bump caps, helmets</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Eye & Face Protection</h3>
                  <p className="text-sm text-gray-600">Safety glasses, goggles, face shields</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Respiratory Protection</h3>
                  <p className="text-sm text-gray-600">Respirators, masks, filters</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Hand Protection</h3>
                  <p className="text-sm text-gray-600">Work gloves, chemical gloves</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Foot Protection</h3>
                  <p className="text-sm text-gray-600">Safety boots, toe guards</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Hi-Vis Apparel</h3>
                  <p className="text-sm text-gray-600">Vests, jackets, shirts</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Fall Protection</h3>
                  <p className="text-sm text-gray-600">Harnesses, lanyards, anchors</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Hearing Protection</h3>
                  <p className="text-sm text-gray-600">Earplugs, earmuffs</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">First Aid</h3>
                  <p className="text-sm text-gray-600">Kits, supplies, cabinets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact GSA Team */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8">
            <div className="text-center mb-8">
              <Building2 className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-safety-green-100">
                Our GSA specialists are here to help with your government procurement needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Email</h4>
                <a href="mailto:gsa@safetypro.com" className="text-safety-green-100 hover:text-white">
                  gsa@safetypro.com
                </a>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Phone</h4>
                <a href="tel:1-800-723-3891" className="text-safety-green-100 hover:text-white">
                  1-800-SAFETY-1
                </a>
                <p className="text-sm text-safety-green-100 mt-1">Press 3 for GSA Sales</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Hours</h4>
                <p className="text-safety-green-100">Monday - Friday</p>
                <p className="text-safety-green-100">8:00 AM - 6:00 PM EST</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                  Create GSA Account
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-safety-green-700">
                  Contact GSA Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
