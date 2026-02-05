import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CheckoutForm } from '@/components/storefront/checkout/CheckoutForm';
import { Button } from '@/components/ui/button';

async function getCheckoutData(userId: string) {
  const [cart, addresses, user, b2bMembership, costCenters] = await Promise.all([
    db.cart.findFirst({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                wholesalePrice: true,
                gsaPrice: true,
                images: true,
                weight: true,
              },
            },
          },
        },
      },
    }),
    db.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        isDefault: 'desc',
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        accountType: true,
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
            id: true,
            name: true,
          },
        },
      },
    }),
    db.b2BAccountMember.findFirst({
      where: { userId },
      include: {
        b2bProfile: {
          select: {
            costCenters: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
                budgetAmount: true,
                currentSpent: true,
              },
            },
          },
        },
      },
    }).then((member) => member?.b2bProfile.costCenters || []),
  ]);

  return { cart, addresses, user, b2bMembership, costCenters };
}

interface CheckoutPageProps {
  searchParams: {
    quote?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/checkout');
  }

  const { cart, addresses, user, b2bMembership, costCenters } = await getCheckoutData(session.user.id);

  if (!cart || cart.items.length === 0) {
    redirect('/cart');
  }

  const isB2BQuote = searchParams.quote === 'true';

  // Transform cart items
  const cartItems = cart.items.map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      slug: item.product.slug,
      basePrice: Number(item.product.basePrice),
      salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
      wholesalePrice: item.product.wholesalePrice ? Number(item.product.wholesalePrice) : null,
      gsaPrice: item.product.gsaPrice ? Number(item.product.gsaPrice) : null,
      images: (item.product.images as string[]) || [],
      weight: item.product.weight ? Number(item.product.weight) : null,
    },
  }));

  // Transform addresses
  const formattedAddresses = addresses.map((addr: any) => ({
    id: addr.id,
    firstName: addr.firstName,
    lastName: addr.lastName,
    address1: addr.address1,
    address2: addr.address2,
    city: addr.city,
    state: addr.state,
    zipCode: addr.zipCode,
    country: addr.country,
    phone: addr.phone,
    isDefault: addr.isDefault,
  }));

  // Transform cost centers
  const formattedCostCenters = costCenters.map((cc: any) => ({
    id: cc.id,
    name: cc.name,
    code: cc.code,
    budgetAmount: Number(cc.budgetAmount),
    currentSpent: Number(cc.currentSpent),
  }));

  // Transform B2B membership
  const formattedB2BMembership = b2bMembership
    ? {
        requiresApproval: b2bMembership.requiresApproval,
        approvalThreshold: b2bMembership.approvalThreshold
          ? Number(b2bMembership.approvalThreshold)
          : null,
        orderLimit: b2bMembership.orderLimit ? Number(b2bMembership.orderLimit) : null,
        costCenter: b2bMembership.costCenter
          ? { id: b2bMembership.costCenter.id, name: b2bMembership.costCenter.name }
          : null,
        companyName: b2bMembership.b2bProfile.companyName,
      }
    : null;

  if (isB2BQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-black mb-2">Request B2B Quote</h1>
            <p className="text-gray-600">Get wholesale pricing for your organization</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <ShieldCheck className="w-16 h-16 text-safety-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-2">Quote Request Submitted</h2>
              <p className="text-gray-600">
                Our sales team will review your request and contact you within 24 hours with a customized quote.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-black mb-4">Items in Quote Request</h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product.name} (x{item.quantity})
                    </span>
                    <span className="font-medium text-black">
                      ${((item.product.wholesalePrice || item.product.basePrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/products" className="flex-1">
                <Button variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white">
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/account" className="flex-1">
                <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                  Go to Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-safety-green-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-black">Checkout</h1>
          <p className="text-gray-600">Complete your order securely</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <CheckoutForm
          cartItems={cartItems}
          addresses={formattedAddresses}
          userEmail={user?.email || ''}
          userName={user?.name || null}
          accountType={user?.accountType || 'INDIVIDUAL'}
          b2bMembership={formattedB2BMembership}
          costCenters={formattedCostCenters}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Checkout | ADA Supplies',
  description: 'Complete your order for professional safety equipment.',
};
