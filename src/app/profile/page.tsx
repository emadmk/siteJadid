import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2, ShieldCheck, Award, MapPin, Package, CreditCard } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getUserProfile(userId: string) {
  const [user, b2bMembership] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        accountType: true,
        role: true,
        image: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        loyaltyProfile: {
          select: {
            points: true,
            lifetimePoints: true,
            tier: true,
          },
        },
        b2bProfile: {
          select: {
            companyName: true,
            taxId: true,
            creditLimit: true,
            creditUsed: true,
            paymentTerms: true,
            status: true,
          },
        },
        gsaProfile: {
          select: {
            contractNumber: true,
            agencyName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            reviews: true,
          },
        },
      },
    }),
    db.b2BAccountMember.findFirst({
      where: { userId },
      include: {
        b2bProfile: {
          select: {
            companyName: true,
          },
        },
        costCenter: {
          select: {
            name: true,
            budgetAmount: true,
            currentSpent: true,
          },
        },
      },
    }),
  ]);

  return { user, b2bMembership };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  const { user, b2bMembership } = await getUserProfile(session.user.id);

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Profile</h1>
              <p className="text-safety-green-100">
                Manage your account settings and preferences
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="bg-white text-safety-green-700 hover:bg-gray-100 border-0">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Personal Information</h2>
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                    Edit Profile
                  </Button>
                </Link>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>Full Name</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {user.name || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {user.email}
                      {user.emailVerified && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {user.phone || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Account Type</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {user.accountType}
                      {!user.isActive && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>User Role</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {user.role.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Package className="w-4 h-4" />
                      <span>Member Since</span>
                    </div>
                    <div className="text-base font-medium text-black">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* B2B Profile */}
            {user.b2bProfile && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-safety-green-600" />
                    <h2 className="text-xl font-bold text-black">Business Account</h2>
                    {user.b2bProfile.status === 'APPROVED' ? (
                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        Approved
                      </span>
                    ) : user.b2bProfile.status === 'REJECTED' ? (
                      <span className="ml-auto text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        Rejected
                      </span>
                    ) : user.b2bProfile.status === 'SUSPENDED' ? (
                      <span className="ml-auto text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                        Suspended
                      </span>
                    ) : (
                      <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Company Name</div>
                      <div className="text-base font-medium text-black">
                        {user.b2bProfile.companyName}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tax ID / EIN</div>
                      <div className="text-base font-medium text-black">
                        {user.b2bProfile.taxId || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Payment Terms</div>
                      <div className="text-base font-medium text-black">
                        Net {user.b2bProfile.paymentTerms}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Credit Limit</div>
                      <div className="text-base font-medium text-black">
                        ${Number(user.b2bProfile.creditLimit).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Credit Used</div>
                      <div className="text-2xl font-bold text-black">
                        ${Number(user.b2bProfile.creditUsed).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-safety-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((Number(user.b2bProfile.creditUsed) / Number(user.b2bProfile.creditLimit)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B2B Membership (Multi-User) */}
            {b2bMembership && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-black">Team Member Role</h2>
                    {b2bMembership.isActive ? (
                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="ml-auto text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Company</div>
                      <div className="text-base font-medium text-black">
                        {b2bMembership.b2bProfile.companyName}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Role</div>
                      <div className="text-base font-medium text-black">
                        {b2bMembership.role.replace(/_/g, ' ')}
                      </div>
                    </div>

                    {b2bMembership.department && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Department</div>
                        <div className="text-base font-medium text-black">
                          {b2bMembership.department}
                        </div>
                      </div>
                    )}

                    {b2bMembership.costCenter && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Cost Center</div>
                        <div className="text-base font-medium text-black">
                          {b2bMembership.costCenter.name}
                        </div>
                      </div>
                    )}

                    {b2bMembership.orderLimit && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Order Limit</div>
                        <div className="text-base font-medium text-black">
                          ${Number(b2bMembership.orderLimit).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {b2bMembership.costCenter && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">Cost Center Budget</div>
                        <div className="text-lg font-bold text-black">
                          ${Number(b2bMembership.costCenter.currentSpent).toLocaleString()} / ${Number(b2bMembership.costCenter.budgetAmount).toLocaleString()}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((Number(b2bMembership.costCenter.currentSpent) / Number(b2bMembership.costCenter.budgetAmount)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {(b2bMembership.role === 'ACCOUNT_ADMIN' || b2bMembership.role === 'APPROVER') && (
                    <div className="pt-4 border-t border-gray-200">
                      <Link href="/b2b/team">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Manage Team Members
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GSA Profile */}
            {user.gsaProfile && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-safety-green-600" />
                    <h2 className="text-xl font-bold text-black">GSA Account</h2>
                    {user.gsaProfile.isActive ? (
                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Agency Name</div>
                      <div className="text-base font-medium text-black">
                        {user.gsaProfile.agencyName || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Contract Number</div>
                      <div className="text-base font-medium text-black">
                        {user.gsaProfile.contractNumber || 'Pending'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Your GSA account is being verified. You'll receive an email once the verification is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Loyalty Profile */}
            {user.loyaltyProfile && (
              <div className="bg-gradient-to-br from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Loyalty Program</h3>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-safety-green-100 mb-1">Current Tier</div>
                  <div className="text-3xl font-bold">{user.loyaltyProfile.tier}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-safety-green-100 mb-1">Available Points</div>
                  <div className="text-4xl font-bold">{user.loyaltyProfile.points.toLocaleString()}</div>
                </div>

                <div className="pt-4 border-t border-safety-green-500">
                  <div className="text-sm text-safety-green-100 mb-1">Lifetime Points</div>
                  <div className="text-xl font-semibold">{user.loyaltyProfile.lifetimePoints.toLocaleString()}</div>
                </div>

                <Link href="/loyalty">
                  <Button className="w-full mt-6 bg-white text-safety-green-700 hover:bg-gray-100">
                    View Rewards
                  </Button>
                </Link>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">Account Stats</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>Total Orders</span>
                  </div>
                  <div className="text-lg font-bold text-black">{user._count.orders}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Saved Addresses</span>
                  </div>
                  <div className="text-lg font-bold text-black">{user._count.addresses}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>Reviews Written</span>
                  </div>
                  <div className="text-lg font-bold text-black">{user._count.reviews}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <Link href="/orders">
                  <Button variant="outline" className="w-full justify-start border-black text-black hover:bg-black hover:text-white gap-2">
                    <Package className="w-4 h-4" />
                    View Orders
                  </Button>
                </Link>

                <Link href="/profile/addresses">
                  <Button variant="outline" className="w-full justify-start border-gray-300 text-black hover:bg-gray-100 gap-2">
                    <MapPin className="w-4 h-4" />
                    Manage Addresses
                  </Button>
                </Link>

                <Link href="/profile/security">
                  <Button variant="outline" className="w-full justify-start border-gray-300 text-black hover:bg-gray-100 gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Security Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
