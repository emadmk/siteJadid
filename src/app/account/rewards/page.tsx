import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Award,
  Gift,
  Star,
  TrendingUp,
  Clock,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';

async function getRewardsData(userId: string) {
  const loyaltyProfile = await db.loyaltyProfile.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  return loyaltyProfile;
}

export default async function RewardsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/account/rewards');
  }

  const loyaltyProfile = await getRewardsData(session.user.id);

  const tierBenefits: Record<string, string[]> = {
    BRONZE: ['Earn 1 point per $1 spent', 'Birthday bonus points', 'Early access to sales'],
    SILVER: ['Earn 1.5 points per $1 spent', 'Free standard shipping', 'Exclusive member discounts'],
    GOLD: ['Earn 2 points per $1 spent', 'Free express shipping', 'Priority customer support'],
    PLATINUM: ['Earn 3 points per $1 spent', 'Free overnight shipping', 'Dedicated account manager'],
  };

  const tierThresholds = {
    BRONZE: 0,
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 10000,
  };

  const currentTier = loyaltyProfile?.tier || 'BRONZE';
  const currentPoints = loyaltyProfile?.points || 0;
  const lifetimePoints = loyaltyProfile?.lifetimePoints || 0;

  const nextTier = currentTier === 'BRONZE' ? 'SILVER' : currentTier === 'SILVER' ? 'GOLD' : currentTier === 'GOLD' ? 'PLATINUM' : null;
  const pointsToNextTier = nextTier ? tierThresholds[nextTier] - lifetimePoints : 0;
  const progressPercent = nextTier
    ? Math.min(100, ((lifetimePoints - tierThresholds[currentTier]) / (tierThresholds[nextTier] - tierThresholds[currentTier])) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">My Rewards</h1>
        <p className="text-gray-600">Track your points and unlock exclusive benefits</p>
      </div>

      {/* Points Summary */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-6 h-6" />
              <span className="font-medium">{currentTier} Member</span>
            </div>
            <div className="text-4xl font-bold mb-1">
              {currentPoints.toLocaleString()} Points
            </div>
            <div className="text-safety-green-100">
              Lifetime: {lifetimePoints.toLocaleString()} points earned
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-sm text-safety-green-100 mb-2">Points Value</div>
            <div className="text-2xl font-bold">
              ${(currentPoints / 100).toFixed(2)}
            </div>
            <div className="text-xs text-safety-green-100">100 points = $1</div>
          </div>
        </div>

        {nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress to {nextTier}</span>
              <span>{pointsToNextTier.toLocaleString()} points to go</span>
            </div>
            <div className="w-full bg-safety-green-800 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/products" className="block">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-safety-green-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-safety-green-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-safety-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Earn Points</h3>
                <p className="text-sm text-gray-600">Shop to earn rewards</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-black">Redeem Points</h3>
              <p className="text-sm text-gray-600">Use at checkout</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-black">Refer Friends</h3>
              <p className="text-sm text-gray-600">Earn 500 bonus points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-black mb-4">Your {currentTier} Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tierBenefits[currentTier]?.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-safety-green-600 rounded-full" />
              {benefit}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black">Points History</h2>
        </div>

        {!loyaltyProfile || loyaltyProfile.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-black mb-1">No transactions yet</h3>
            <p className="text-sm text-gray-600">
              Start shopping to earn points
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {loyaltyProfile.transactions.map((transaction: any) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">{transaction.description}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div className={`font-bold ${transaction.points >= 0 ? 'text-safety-green-600' : 'text-red-600'}`}>
                  {transaction.points >= 0 ? '+' : ''}{transaction.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Rewards | AdaSupply',
  description: 'Track your loyalty points and unlock exclusive rewards.',
};
