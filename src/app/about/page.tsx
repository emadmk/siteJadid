import { Metadata } from 'next';
import { ShieldCheck, Users, Award, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Safety Equipment Store',
  description: 'Learn about our mission to provide the best safety equipment for businesses and individuals',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Your trusted partner in workplace safety for over 25 years
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Statement */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At Safety Equipment Store, we are committed to protecting workers and creating safer work environments
            across America. We believe that every person deserves to return home safely at the end of each workday.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Since 1998, we have been providing high-quality personal protective equipment, safety gear, and
            compliance solutions to businesses of all sizes, from small contractors to Fortune 500 companies
            and government agencies.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">25+</div>
            <div className="text-gray-600">Years in Business</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-gray-600">Customers Served</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
            <div className="text-gray-600">Products</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">99.5%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ShieldCheck className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety First</h3>
            <p className="text-gray-600">
              We never compromise on safety. Every product meets or exceeds industry standards.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <Award className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Assured</h3>
            <p className="text-gray-600">
              All products are sourced from certified manufacturers and rigorously tested.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Focus</h3>
            <p className="text-gray-600">
              Your safety needs are our priority. We provide expert guidance and support.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
            <p className="text-gray-600">
              We continuously update our inventory with the latest safety technology.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-700 max-w-none">
            <p className="mb-4">
              Safety Equipment Store was founded in 1998 by John Mitchell, a former construction safety manager
              who saw a need for reliable, affordable safety equipment that didn't compromise on quality.
            </p>
            <p className="mb-4">
              What started as a small warehouse in California has grown into one of the nation's leading suppliers
              of safety equipment. Today, we serve customers across all 50 states, including contractors,
              manufacturers, healthcare facilities, schools, and government agencies.
            </p>
            <p className="mb-4">
              Our commitment to safety has earned us numerous industry awards and certifications, including
              GSA Schedule holder status, allowing us to serve federal, state, and local government agencies.
            </p>
          </div>
        </div>

        {/* Certifications & Partnerships */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Certifications & Partnerships</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Industry Certifications</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>ANSI Authorized Dealer</li>
                <li>OSHA Compliance Partner</li>
                <li>GSA Schedule Contract Holder</li>
                <li>ISO 9001:2015 Certified</li>
                <li>NFPA Member Organization</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Manufacturer Partnerships</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>3M Authorized Distributor</li>
                <li>Honeywell Safety Products Partner</li>
                <li>MSA Safety Certified Dealer</li>
                <li>DuPont Personal Protection Solutions</li>
                <li>Ansell Healthcare Provider</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
