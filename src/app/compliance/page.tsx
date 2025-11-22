import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Award, FileCheck, Building2, CheckCircle2 } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Safety Compliance & Certifications</h1>
          <p className="text-safety-green-100">
            Meeting and exceeding industry safety standards
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Compliance Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-10 h-10 text-safety-green-600" />
              <div>
                <h2 className="text-3xl font-bold text-black">Our Commitment to Safety</h2>
                <p className="text-gray-600 mt-1">Industry-leading standards and certifications</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              At SafetyPro Supply, we are committed to providing safety equipment that meets or exceeds all applicable industry standards and regulations. Our products undergo rigorous testing and certification to ensure they provide the highest level of protection for workers across all industries.
            </p>
          </div>

          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ANSI */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">ANSI</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                American National Standards Institute
              </p>
              <p className="text-gray-600 text-sm">
                Our products comply with ANSI standards for personal protective equipment, ensuring workplace safety across various industries.
              </p>
            </div>

            {/* OSHA */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">OSHA</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Occupational Safety and Health Administration
              </p>
              <p className="text-gray-600 text-sm">
                All products meet or exceed OSHA requirements for workplace safety and health protection.
              </p>
            </div>

            {/* NIOSH */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileCheck className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">NIOSH</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                National Institute for Occupational Safety
              </p>
              <p className="text-gray-600 text-sm">
                Respiratory protection products are NIOSH-approved for filtering efficiency and air quality.
              </p>
            </div>

            {/* ASTM */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">ASTM</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                American Society for Testing and Materials
              </p>
              <p className="text-gray-600 text-sm">
                Products tested and certified to ASTM standards for material quality and performance.
              </p>
            </div>

            {/* CSA */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">CSA</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Canadian Standards Association
              </p>
              <p className="text-gray-600 text-sm">
                Products certified for North American markets with CSA approval marks.
              </p>
            </div>

            {/* EN Standards */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-safety-green-600" />
                <h3 className="text-xl font-bold text-black">EN Standards</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                European Safety Standards
              </p>
              <p className="text-gray-600 text-sm">
                Select products meet European EN standards for international compliance.
              </p>
            </div>
          </div>

          {/* Product Categories Compliance */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Compliance by Product Category</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Head Protection */}
                <div>
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    Head Protection
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ANSI/ISEA Z89.1 - Hard Hats and Helmets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>OSHA 1910.135 - Head Protection Standards</span>
                    </li>
                  </ul>
                </div>

                {/* Eye and Face Protection */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    Eye and Face Protection
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ANSI/ISEA Z87.1 - Eye and Face Protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>OSHA 1910.133 - Eye and Face Protection</span>
                    </li>
                  </ul>
                </div>

                {/* Respiratory Protection */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    Respiratory Protection
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>NIOSH 42 CFR Part 84 - Respiratory Protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>OSHA 1910.134 - Respiratory Protection Standards</span>
                    </li>
                  </ul>
                </div>

                {/* Hand Protection */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    Hand Protection
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ANSI/ISEA 105 - Hand Protection Selection Criteria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ASTM F1790 - Cut Resistance Standards</span>
                    </li>
                  </ul>
                </div>

                {/* Foot Protection */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    Foot Protection
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ASTM F2412/F2413 - Protective Footwear Standards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>OSHA 1910.136 - Foot Protection Requirements</span>
                    </li>
                  </ul>
                </div>

                {/* High-Visibility Clothing */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-safety-green-600" />
                    High-Visibility Clothing
                  </h3>
                  <ul className="space-y-2 text-gray-600 ml-7">
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ANSI/ISEA 107 - High-Visibility Safety Apparel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-safety-green-600 mt-1">•</span>
                      <span>ASTM F1506 - Flame-Resistant Textiles</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Assurance */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Quality Assurance</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">Rigorous Testing</h3>
                  <p className="text-gray-600 text-sm">
                    All products undergo comprehensive testing before certification, including impact resistance, chemical resistance, and durability assessments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">Regular Audits</h3>
                  <p className="text-gray-600 text-sm">
                    Our suppliers and products are subject to regular third-party audits to ensure continued compliance with all applicable standards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">Documentation</h3>
                  <p className="text-gray-600 text-sm">
                    Complete certification documentation and test reports are available for all products upon request.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-safety-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">Traceability</h3>
                  <p className="text-gray-600 text-sm">
                    Every product can be traced back to its manufacturing batch for quality control and recall management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Standards */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Industry-Specific Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-black mb-3">Construction</h3>
                <p className="text-gray-600 text-sm">
                  Full compliance with OSHA construction standards (1926 subparts) for fall protection, scaffolding, and power tools.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-3">Manufacturing</h3>
                <p className="text-gray-600 text-sm">
                  Equipment certified for industrial environments including chemical handling, machine operation, and materials handling.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-3">Healthcare</h3>
                <p className="text-gray-600 text-sm">
                  PPE meeting FDA and CDC guidelines for healthcare settings, including infection control and biohazard protection.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-3">Oil & Gas</h3>
                <p className="text-gray-600 text-sm">
                  Flame-resistant clothing and equipment certified for hazardous environments and confined spaces.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white rounded-lg p-8 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Questions about compliance?</h3>
            <p className="mb-6 text-safety-green-100">
              Our safety experts can help you find the right certified equipment for your needs
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                  Contact Our Team
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
      </div>
    </div>
  );
}
