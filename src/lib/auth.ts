import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from './account-lockout';

// Enums matching Prisma schema
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  CUSTOMER = 'CUSTOMER',
  B2B_CUSTOMER = 'B2B_CUSTOMER',
  GSA_CUSTOMER = 'GSA_CUSTOMER',
  PERSONAL_CUSTOMER = 'PERSONAL_CUSTOMER',
  VOLUME_BUYER_CUSTOMER = 'VOLUME_BUYER_CUSTOMER',
  GOVERNMENT_CUSTOMER = 'GOVERNMENT_CUSTOMER',
}

enum AccountType {
  B2C = 'B2C',
  B2B = 'B2B',
  GSA = 'GSA',
  PERSONAL = 'PERSONAL',
  VOLUME_BUYER = 'VOLUME_BUYER',
  GOVERNMENT = 'GOVERNMENT',
}

// SECURITY FIX (AUTH-H5): Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check account lockout
        const lockStatus = await isAccountLocked(credentials.email);
        if (lockStatus.locked) {
          const minutes = Math.ceil(lockStatus.remainingSeconds / 60);
          throw new Error(`Account is temporarily locked. Try again in ${minutes} minutes.`);
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            loyaltyProfile: true,
            b2bProfile: true,
            gsaProfile: true,
          },
        });

        if (!user || !user.password) {
          // Record failed attempt even for non-existent users (prevent enumeration)
          await recordFailedAttempt(credentials.email);
          throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const result = await recordFailedAttempt(credentials.email);
          if (result.locked) {
            throw new Error('Too many failed attempts. Account locked for 15 minutes.');
          }
          throw new Error('Invalid credentials');
        }

        // Check email verification (admin roles are exempt)
        const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER_SERVICE', 'WAREHOUSE_MANAGER', 'MARKETING_MANAGER', 'CONTENT_MANAGER'];
        if (!adminRoles.includes(user.role) && !user.emailVerified) {
          throw new Error('Please verify your email address. Check your inbox for the verification link.');
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(credentials.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          gsaApprovalStatus: user.gsaApprovalStatus,
          approvalStatus: user.approvalStatus,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType = user.accountType;
        token.gsaApprovalStatus = user.gsaApprovalStatus;
        token.approvalStatus = user.approvalStatus;
        token.roleRefreshedAt = Date.now();
      }
      // Refresh role from DB every 5 minutes
      if (token.id && (!token.roleRefreshedAt || Date.now() - (token.roleRefreshedAt as number) > 5 * 60 * 1000)) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, accountType: true, isActive: true, approvalStatus: true, gsaApprovalStatus: true },
          });
          if (dbUser) {
            if (!dbUser.isActive) {
              // User deactivated - invalidate token
              return { ...token, role: 'CUSTOMER', accountType: 'B2C' };
            }
            token.role = dbUser.role;
            token.accountType = dbUser.accountType;
            token.approvalStatus = dbUser.approvalStatus;
            token.gsaApprovalStatus = dbUser.gsaApprovalStatus;
          }
          token.roleRefreshedAt = Date.now();
        } catch {
          // If DB fails, keep existing token data
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.accountType = token.accountType as AccountType;
        session.user.gsaApprovalStatus = token.gsaApprovalStatus as any;
        session.user.approvalStatus = token.approvalStatus as any;
      }
      return session;
    },
  },
};

// Role-based access control utilities
export const permissions = {
  // Admin permissions
  canAccessAdminDashboard: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
  },

  canManageUsers: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
  },

  canManageProducts: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);
  },

  canManageOrders: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER_SERVICE].includes(role);
  },

  // Accountant permissions
  canAccessFinancials: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role);
  },

  canManageInvoices: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role);
  },

  // Warehouse permissions
  canManageInventory: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER].includes(role);
  },

  canManageShipments: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER].includes(role);
  },

  // Marketing permissions
  canManageDiscounts: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MARKETING_MANAGER].includes(role);
  },

  canViewAnalytics: (role: UserRole) => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MARKETING_MANAGER, UserRole.ACCOUNTANT].includes(role);
  },

  // Customer permissions
  canPlaceOrder: (role: UserRole) => {
    return [UserRole.CUSTOMER, UserRole.B2B_CUSTOMER, UserRole.GSA_CUSTOMER].includes(role);
  },

  canAccessB2BPricing: (accountType: AccountType) => {
    return accountType === AccountType.B2B || accountType === AccountType.VOLUME_BUYER;
  },

  canAccessGSAPricing: (accountType: AccountType) => {
    return accountType === AccountType.GSA || accountType === AccountType.GOVERNMENT;
  },

  canAccessVolumeBuyerPricing: (accountType: AccountType) => {
    return accountType === AccountType.B2B || accountType === AccountType.VOLUME_BUYER;
  },

  canAccessGovernmentPricing: (accountType: AccountType) => {
    return accountType === AccountType.GSA || accountType === AccountType.GOVERNMENT;
  },
};

// Middleware helper for API routes
export function requireAuth(
  handler: Function,
  options?: {
    roles?: UserRole[];
    accountTypes?: AccountType[];
  }
) {
  return async (req: any, res: any, session: any) => {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (options?.roles && !options.roles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (options?.accountTypes && !options.accountTypes.includes(session.user.accountType)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return handler(req, res, session);
  };
}

export default authOptions;
