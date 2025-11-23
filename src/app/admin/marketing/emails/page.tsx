import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';

export default function EmailCampaignsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <Button><Plus className="w-4 h-4 mr-2" />Create Campaign</Button>
      </div>
      <div className="bg-white rounded-lg border p-6 text-center">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No campaigns yet. Create your first email campaign.</p>
      </div>
    </div>
  );
}
