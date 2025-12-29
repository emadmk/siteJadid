import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  HardHat,
  Shirt,
  Footprints,
  Hand,
  Eye,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Droplets,
  Sun,
  Wind,
  Thermometer
} from 'lucide-react';

export default function ProductCarePage() {
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
              <Sparkles className="w-6 h-6 text-safety-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Product Care Guide</h1>
              <p className="text-gray-600">Keep your safety equipment in top condition</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* General Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-yellow-900 mb-2">Important Safety Notice</h2>
              <p className="text-sm text-yellow-700">
                Proper maintenance of safety equipment is essential for your protection. Damaged or improperly maintained equipment may not provide adequate protection. Always inspect your equipment before each use and replace items that show signs of wear, damage, or degradation.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600" />
                  Do
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Clean with mild soap and water</li>
                  <li>Inspect for cracks, dents, and signs of wear before each use</li>
                  <li>Store in a cool, dry place away from direct sunlight</li>
                  <li>Replace suspension system if it shows signs of wear</li>
                  <li>Replace hard hat after any significant impact</li>
                  <li>Follow manufacturer's replacement schedule (typically 2-5 years)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Don't
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Paint or apply stickers that cover the shell</li>
                  <li>Drill holes or modify the hard hat</li>
                  <li>Store in direct sunlight or extreme temperatures</li>
                  <li>Use solvents or harsh chemicals for cleaning</li>
                  <li>Wear backwards unless specifically designed for reverse wear</li>
                  <li>Continue using after visible damage</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-black mb-2">Replacement Indicators</h4>
              <p className="text-sm text-gray-600">
                Replace your hard hat if you notice: chalking or flaking of the shell, fading color, cracks or dents, brittleness, or if it has been exposed to chemical splash.
              </p>
            </div>
          </div>
        </div>

        {/* High-Visibility Clothing */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shirt className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-black">High-Visibility Clothing</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-black mb-3">Washing Instructions</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Droplets className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-black">Water Temperature:</span> Wash in cold or warm water (max 104°F / 40°C)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wind className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-black">Drying:</span> Tumble dry on low heat or hang dry
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-black">Storage:</span> Keep away from direct sunlight when not in use
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Avoid
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Bleach or harsh detergents</li>
                  <li>Fabric softeners (reduces retroreflectivity)</li>
                  <li>High heat ironing</li>
                  <li>Dry cleaning</li>
                  <li>Washing with heavily soiled items</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-black mb-2">When to Replace</h4>
              <p className="text-sm text-gray-600">
                Replace high-visibility garments when: the fluorescent background material has faded significantly, retroreflective tape is damaged, cracked, or peeling, or the garment has holes, tears, or excessive wear.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Boots */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Footprints className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-black">Safety Boots & Footwear</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-black mb-3">Daily Care</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Remove dirt and debris after each use</li>
                  <li>Allow boots to dry naturally at room temperature</li>
                  <li>Use shoe trees or newspaper to maintain shape while drying</li>
                  <li>Apply leather conditioner to leather boots regularly</li>
                  <li>Check laces and replace if frayed</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3">Deep Cleaning</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Remove laces and insoles before cleaning</li>
                  <li>Use appropriate cleaner for the boot material</li>
                  <li>For leather: saddle soap or leather cleaner</li>
                  <li>For rubber: mild detergent and water</li>
                  <li>Allow to dry completely before storing</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Avoid Heat
                </h4>
                <p className="text-sm text-red-700">
                  Never dry boots near heaters or in direct sunlight - this can damage the materials and adhesives.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Waterproofing</h4>
                <p className="text-sm text-blue-700">
                  Reapply waterproofing treatment regularly, especially after cleaning or when water no longer beads on the surface.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Sole Inspection</h4>
                <p className="text-sm text-yellow-700">
                  Check soles for wear patterns and separation. Replace boots when treads are worn smooth.
                </p>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold text-black mb-3">Leather Gloves</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Clean with damp cloth</li>
                  <li>Apply leather conditioner periodically</li>
                  <li>Air dry naturally</li>
                  <li>Store flat or hang to maintain shape</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3">Coated Gloves</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Machine wash in cold water</li>
                  <li>Use mild detergent</li>
                  <li>Air dry recommended</li>
                  <li>Check coating for cracks or peeling</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3">Cut-Resistant Gloves</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Follow manufacturer's care instructions</li>
                  <li>Inspect for cuts or damage before each use</li>
                  <li>Replace immediately if cut protection is compromised</li>
                  <li>Some can be machine washed</li>
                </ul>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-safety-green-600" />
                  Proper Care
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Rinse lenses with water before wiping to remove debris</li>
                  <li>Clean with mild soap and water or lens cleaner</li>
                  <li>Use a soft, lint-free cloth or microfiber</li>
                  <li>Store in a protective case when not in use</li>
                  <li>Keep away from chemicals and solvents</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-black mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Avoid
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Paper towels or rough cloths (can scratch lenses)</li>
                  <li>Harsh chemicals or solvents</li>
                  <li>Leaving in hot vehicles</li>
                  <li>Placing lens-down on surfaces</li>
                  <li>Using damaged eyewear</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-black mb-2">Anti-Fog Lens Care</h4>
              <p className="text-sm text-gray-600">
                For anti-fog coated lenses, avoid touching the inner lens surface. Clean gently with water and allow to air dry. Harsh cleaning can degrade the anti-fog coating.
              </p>
            </div>
          </div>
        </div>

        {/* Storage Tips */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-black">General Storage Guidelines</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Sun className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h4 className="font-medium text-black mb-1">Away from Sunlight</h4>
                <p className="text-sm text-gray-600">UV rays can degrade materials over time</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Thermometer className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-medium text-black mb-1">Cool Temperature</h4>
                <p className="text-sm text-gray-600">Avoid extreme heat or cold</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-black mb-1">Dry Location</h4>
                <p className="text-sm text-gray-600">Moisture can cause mold and degradation</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Wind className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h4 className="font-medium text-black mb-1">Well Ventilated</h4>
                <p className="text-sm text-gray-600">Allow air circulation to prevent odors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-safety-green-50 border border-safety-green-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-black mb-2">Need More Information?</h2>
          <p className="text-gray-600 mb-4">
            Contact us for specific care instructions or replacement recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button className="bg-safety-green-600 hover:bg-safety-green-700">
                Contact Support
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Product Care Guide | ADA Supply',
  description: 'Learn how to properly care for and maintain your safety equipment for maximum protection and longevity.',
};
