import { Button } from '@/components/ui/button';
import {
  Settings as SettingsIcon,
  Store,
  Mail,
  CreditCard,
  Truck,
  Shield,
  Bell,
  Globe,
} from 'lucide-react';

export default async function SettingsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
        <p className="text-gray-600">Manage your store settings and configurations</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-safety-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Store Information</h2>
                <p className="text-sm text-gray-600">Basic store details</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  defaultValue="SafetyPro Store"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <textarea
                  rows={3}
                  defaultValue="Professional safety equipment and supplies"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  defaultValue="info@safetypro.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Save Store Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Email Notifications</h2>
                <p className="text-sm text-gray-600">Configure email settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Order Confirmations</div>
                  <div className="text-sm text-gray-600">
                    Send email when orders are placed
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Shipping Updates</div>
                  <div className="text-sm text-gray-600">
                    Notify customers of shipping status
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Low Stock Alerts</div>
                  <div className="text-sm text-gray-600">
                    Alert admins when inventory is low
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Marketing Emails</div>
                  <div className="text-sm text-gray-600">
                    Send promotional content to customers
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Save Email Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Payment Methods</h2>
                <p className="text-sm text-gray-600">Manage payment options</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-black">Credit/Debit Cards</div>
                    <div className="text-sm text-gray-600">Stripe Integration</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-safety-green-100 text-safety-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-black">PayPal</div>
                    <div className="text-sm text-gray-600">PayPal Integration</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  Inactive
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-black">GSA SmartPay</div>
                    <div className="text-sm text-gray-600">Government Procurement</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-safety-green-100 text-safety-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Configure Payment Methods
              </Button>
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Shipping Options</h2>
                <p className="text-sm text-gray-600">Configure shipping methods</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Shipping Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    $
                  </span>
                  <input
                    type="number"
                    defaultValue="100"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Shipping Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    $
                  </span>
                  <input
                    type="number"
                    defaultValue="9.99"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Express Shipping Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    $
                  </span>
                  <input
                    type="number"
                    defaultValue="24.99"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
                <label className="text-sm text-gray-700">
                  Enable international shipping
                </label>
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Save Shipping Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Tax Settings</h2>
                <p className="text-sm text-gray-600">Configure tax rates</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  defaultValue="8.5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
                <label className="text-sm text-gray-700">Apply tax to shipping</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
                <label className="text-sm text-gray-700">
                  GSA orders are tax-exempt
                </label>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  For state-specific tax rates, configure them in the tax management
                  section.
                </p>
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Save Tax Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Security</h2>
                <p className="text-sm text-gray-600">Security and privacy settings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">
                    Require 2FA for admin accounts
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-safety-green-600 rounded focus:ring-safety-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Session Timeout</div>
                  <div className="text-sm text-gray-600">Auto-logout after inactivity</div>
                </div>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">Password Expiry</div>
                  <div className="text-sm text-gray-600">Force password reset</div>
                </div>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                  <option>Never</option>
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>180 days</option>
                </select>
              </div>
              <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                Save Security Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
