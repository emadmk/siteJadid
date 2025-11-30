import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reports & Export</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <FileText className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Sales Report</h3>
          <p className="text-gray-600 mb-4">Export sales data to Excel or PDF</p>
          <Button><Download className="w-4 h-4 mr-2" />Download Excel</Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <FileText className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Inventory Report</h3>
          <p className="text-gray-600 mb-4">Export inventory data</p>
          <Button><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>
      </div>
    </div>
  );
}
