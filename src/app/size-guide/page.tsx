import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Ruler,
  HardHat,
  Shirt,
  Footprints,
  Hand,
  Eye,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <Ruler className="w-6 h-6 text-safety-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Size Guide</h1>
              <p className="text-gray-600">Find the perfect fit for your safety gear</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* How to Measure */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-blue-900 mb-2">How to Measure</h2>
              <p className="text-sm text-blue-700">
                For the most accurate fit, take measurements over light clothing. Use a flexible measuring tape and keep it snug but not tight. If you're between sizes, we recommend ordering the larger size for comfort.
              </p>
            </div>
          </div>
        </div>

        {/* Hard Hats */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <HardHat className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Hard Hats & Head Protection</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Measure around the largest part of your head, approximately 1 inch above your eyebrows.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Size</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Head Circumference (inches)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Head Circumference (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">Small</td>
                    <td className="px-4 py-3">20" - 21"</td>
                    <td className="px-4 py-3">51 - 53 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Medium</td>
                    <td className="px-4 py-3">21" - 22.5"</td>
                    <td className="px-4 py-3">53 - 57 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Large</td>
                    <td className="px-4 py-3">22.5" - 24"</td>
                    <td className="px-4 py-3">57 - 61 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">X-Large</td>
                    <td className="px-4 py-3">24" - 25.5"</td>
                    <td className="px-4 py-3">61 - 65 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Workwear / Clothing */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shirt className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Workwear & High-Visibility Clothing</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Chest: Measure around the fullest part of your chest, keeping the tape horizontal.
              Waist: Measure around your natural waistline.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Size</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Chest (inches)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Waist (inches)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Chest (cm)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Waist (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">S</td>
                    <td className="px-4 py-3">34" - 36"</td>
                    <td className="px-4 py-3">28" - 30"</td>
                    <td className="px-4 py-3">86 - 91 cm</td>
                    <td className="px-4 py-3">71 - 76 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">M</td>
                    <td className="px-4 py-3">38" - 40"</td>
                    <td className="px-4 py-3">32" - 34"</td>
                    <td className="px-4 py-3">97 - 102 cm</td>
                    <td className="px-4 py-3">81 - 86 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">L</td>
                    <td className="px-4 py-3">42" - 44"</td>
                    <td className="px-4 py-3">36" - 38"</td>
                    <td className="px-4 py-3">107 - 112 cm</td>
                    <td className="px-4 py-3">91 - 97 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">XL</td>
                    <td className="px-4 py-3">46" - 48"</td>
                    <td className="px-4 py-3">40" - 42"</td>
                    <td className="px-4 py-3">117 - 122 cm</td>
                    <td className="px-4 py-3">102 - 107 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">2XL</td>
                    <td className="px-4 py-3">50" - 52"</td>
                    <td className="px-4 py-3">44" - 46"</td>
                    <td className="px-4 py-3">127 - 132 cm</td>
                    <td className="px-4 py-3">112 - 117 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">3XL</td>
                    <td className="px-4 py-3">54" - 56"</td>
                    <td className="px-4 py-3">48" - 50"</td>
                    <td className="px-4 py-3">137 - 142 cm</td>
                    <td className="px-4 py-3">122 - 127 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Safety Boots */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Footprints className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Safety Boots & Footwear</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Measure your foot length from heel to longest toe. For width, measure the widest part of your foot.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">US Men's</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">US Women's</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">UK</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">EU</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Foot Length (inches)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">7</td>
                    <td className="px-4 py-3">8.5</td>
                    <td className="px-4 py-3">6</td>
                    <td className="px-4 py-3">40</td>
                    <td className="px-4 py-3">9.6"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">8</td>
                    <td className="px-4 py-3">9.5</td>
                    <td className="px-4 py-3">7</td>
                    <td className="px-4 py-3">41</td>
                    <td className="px-4 py-3">9.9"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">9</td>
                    <td className="px-4 py-3">10.5</td>
                    <td className="px-4 py-3">8</td>
                    <td className="px-4 py-3">42</td>
                    <td className="px-4 py-3">10.2"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">10</td>
                    <td className="px-4 py-3">11.5</td>
                    <td className="px-4 py-3">9</td>
                    <td className="px-4 py-3">43</td>
                    <td className="px-4 py-3">10.6"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">11</td>
                    <td className="px-4 py-3">12.5</td>
                    <td className="px-4 py-3">10</td>
                    <td className="px-4 py-3">44</td>
                    <td className="px-4 py-3">10.9"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">12</td>
                    <td className="px-4 py-3">13.5</td>
                    <td className="px-4 py-3">11</td>
                    <td className="px-4 py-3">46</td>
                    <td className="px-4 py-3">11.3"</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">13</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">12</td>
                    <td className="px-4 py-3">47</td>
                    <td className="px-4 py-3">11.6"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Safety Gloves */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Hand className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Safety Gloves</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Measure around your dominant hand, just below the knuckles, excluding the thumb.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Size</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Palm Width (inches)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Palm Width (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">XS</td>
                    <td className="px-4 py-3">6" - 7"</td>
                    <td className="px-4 py-3">15 - 18 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">S</td>
                    <td className="px-4 py-3">7" - 8"</td>
                    <td className="px-4 py-3">18 - 20 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">M</td>
                    <td className="px-4 py-3">8" - 9"</td>
                    <td className="px-4 py-3">20 - 23 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">L</td>
                    <td className="px-4 py-3">9" - 10"</td>
                    <td className="px-4 py-3">23 - 25 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">XL</td>
                    <td className="px-4 py-3">10" - 11"</td>
                    <td className="px-4 py-3">25 - 28 cm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">2XL</td>
                    <td className="px-4 py-3">11" - 12"</td>
                    <td className="px-4 py-3">28 - 30 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Safety Glasses */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Safety Glasses & Goggles</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Safety eyewear is typically one-size-fits-most with adjustable features. Frame measurements are listed on the temple arm.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-black mb-2">Lens Width</h4>
                <p className="text-sm text-gray-600">
                  Distance across one lens. Standard: 55-60mm
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-black mb-2">Bridge Width</h4>
                <p className="text-sm text-gray-600">
                  Distance between lenses. Standard: 16-20mm
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-black mb-2">Temple Length</h4>
                <p className="text-sm text-gray-600">
                  Length of the arm. Standard: 125-145mm
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Need Help */}
        <div className="bg-safety-green-50 border border-safety-green-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-black mb-2">Still Not Sure?</h2>
          <p className="text-gray-600 mb-4">
            Our team is here to help you find the perfect fit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button className="bg-safety-green-600 hover:bg-safety-green-700">
                Contact Us
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Size Guide | AdaSupply',
  description: 'Find the perfect fit with our comprehensive size guide for safety equipment and workwear.',
};
