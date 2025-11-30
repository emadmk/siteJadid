import { Button } from '@/components/ui/button';
import { Image, Plus } from 'lucide-react';

export default function BannersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Banner Management</h1>
        <Button><Plus className="w-4 h-4 mr-2" />Add Banner</Button>
      </div>
      <div className="bg-white rounded-lg border p-6 text-center">
        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No banners configured. Add promotional banners.</p>
      </div>
    </div>
  );
}
