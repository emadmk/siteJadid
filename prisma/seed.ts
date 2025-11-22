import { PrismaClient, UserRole, AccountType, LoyaltyTier, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // USERS
  // ============================================
  console.log('Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@ecommerce.com' },
    update: {},
    create: {
      email: 'superadmin@ecommerce.com',
      password: hashedPassword,
      name: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@ecommerce.com' },
    update: {},
    create: {
      email: 'accountant@ecommerce.com',
      password: hashedPassword,
      name: 'John Accountant',
      role: UserRole.ACCOUNTANT,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'Jane Customer',
      phone: '+1-555-0100',
      role: UserRole.CUSTOMER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const b2bCustomer = await prisma.user.upsert({
    where: { email: 'b2b@company.com' },
    update: {},
    create: {
      email: 'b2b@company.com',
      password: hashedPassword,
      name: 'B2B Corporate Account',
      phone: '+1-555-0200',
      role: UserRole.B2B_CUSTOMER,
      accountType: AccountType.B2B,
      emailVerified: new Date(),
    },
  });

  const gsaCustomer = await prisma.user.upsert({
    where: { email: 'gsa@agency.gov' },
    update: {},
    create: {
      email: 'gsa@agency.gov',
      password: hashedPassword,
      name: 'GSA Agency Buyer',
      phone: '+1-555-0300',
      role: UserRole.GSA_CUSTOMER,
      accountType: AccountType.GSA,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Users created');

  // ============================================
  // LOYALTY PROFILES
  // ============================================
  console.log('Creating loyalty profiles...');

  await prisma.loyaltyProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      tier: LoyaltyTier.GOLD,
      points: 1500,
      lifetimePoints: 3000,
      lifetimeSpent: 5000,
    },
  });

  console.log('✅ Loyalty profiles created');

  // ============================================
  // B2B PROFILE
  // ============================================
  console.log('Creating B2B profile...');

  await prisma.b2BProfile.upsert({
    where: { userId: b2bCustomer.id },
    update: {},
    create: {
      userId: b2bCustomer.id,
      companyName: 'Acme Corporation',
      taxId: '12-3456789',
      businessLicense: 'BL-2024-001',
      creditLimit: 50000,
      creditUsed: 12500,
      paymentTerms: 30,
      discountPercent: 15,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  console.log('✅ B2B profile created');

  // ============================================
  // GSA PROFILE
  // ============================================
  console.log('Creating GSA profile...');

  await prisma.gSAProfile.upsert({
    where: { userId: gsaCustomer.id },
    update: {},
    create: {
      userId: gsaCustomer.id,
      agencyName: 'General Services Administration',
      contractNumber: 'GS-00F-0001X',
      gsaSchedule: 'Schedule 70',
      vendorId: 'V123456',
      cageCode: '1ABC2',
      dunsBradstreet: '123456789',
      fiscalYear: '2024',
      isActive: true,
    },
  });

  console.log('✅ GSA profile created');

  // ============================================
  // ADDRESSES
  // ============================================
  console.log('Creating addresses...');

  const customerAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      type: 'BOTH',
      firstName: 'Jane',
      lastName: 'Customer',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      phone: '+1-555-0100',
      isDefault: true,
    },
  });

  const b2bAddress = await prisma.address.create({
    data: {
      userId: b2bCustomer.id,
      type: 'BOTH',
      firstName: 'Corporate',
      lastName: 'Buyer',
      company: 'Acme Corporation',
      address1: '456 Business Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
      phone: '+1-555-0200',
      isDefault: true,
    },
  });

  const gsaAddress = await prisma.address.create({
    data: {
      userId: gsaCustomer.id,
      type: 'BOTH',
      firstName: 'Agency',
      lastName: 'Procurement',
      company: 'General Services Administration',
      address1: '1800 F Street NW',
      city: 'Washington',
      state: 'DC',
      zipCode: '20405',
      country: 'USA',
      phone: '+1-555-0300',
      isDefault: true,
    },
  });

  console.log('✅ Addresses created');

  // ============================================
  // CATEGORIES
  // ============================================
  console.log('Creating categories...');

  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      order: 1,
    },
  });

  const computers = await prisma.category.create({
    data: {
      name: 'Computers & Laptops',
      slug: 'computers-laptops',
      description: 'Desktop computers, laptops, and accessories',
      parentId: electronics.id,
      isActive: true,
      order: 1,
    },
  });

  const officeSupplies = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      slug: 'office-supplies',
      description: 'Office furniture, stationery, and supplies',
      isActive: true,
      order: 2,
    },
  });

  const furniture = await prisma.category.create({
    data: {
      name: 'Office Furniture',
      slug: 'office-furniture',
      description: 'Desks, chairs, and office furniture',
      parentId: officeSupplies.id,
      isActive: true,
      order: 1,
    },
  });

  console.log('✅ Categories created');

  // ============================================
  // PRODUCTS (10+ Products)
  // ============================================
  console.log('Creating products...');

  const products = [
    {
      sku: 'LAPTOP-001',
      name: 'Professional Business Laptop',
      slug: 'professional-business-laptop',
      description: 'High-performance laptop perfect for business professionals. Intel i7 processor, 16GB RAM, 512GB SSD.',
      shortDescription: 'Professional laptop with Intel i7, 16GB RAM',
      status: ProductStatus.ACTIVE,
      basePrice: 1299.99,
      salePrice: 1199.99,
      cost: 800,
      wholesalePrice: 1050,
      gsaPrice: 1150,
      gsaSin: 'SIN-123-456',
      stockQuantity: 50,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
      isFeatured: true,
      isBestSeller: true,
      metaTitle: 'Professional Business Laptop - Best for Work',
      metaDescription: 'High-performance business laptop with Intel i7 processor',
      publishedAt: new Date(),
    },
    {
      sku: 'DESK-001',
      name: 'Executive Standing Desk',
      slug: 'executive-standing-desk',
      description: 'Adjustable height standing desk with electric motor. Premium quality for modern offices.',
      shortDescription: 'Electric standing desk, adjustable height',
      status: ProductStatus.ACTIVE,
      basePrice: 799.99,
      salePrice: 699.99,
      cost: 400,
      wholesalePrice: 600,
      gsaPrice: 650,
      gsaSin: 'SIN-234-567',
      stockQuantity: 30,
      categoryId: furniture.id,
      images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800'],
      isFeatured: true,
      metaTitle: 'Executive Standing Desk',
      publishedAt: new Date(),
    },
    {
      sku: 'CHAIR-001',
      name: 'Ergonomic Office Chair',
      slug: 'ergonomic-office-chair',
      description: 'Premium ergonomic chair with lumbar support and adjustable armrests. Perfect for long working hours.',
      shortDescription: 'Ergonomic chair with lumbar support',
      status: ProductStatus.ACTIVE,
      basePrice: 449.99,
      salePrice: 399.99,
      cost: 200,
      wholesalePrice: 350,
      gsaPrice: 380,
      gsaSin: 'SIN-345-678',
      stockQuantity: 75,
      categoryId: furniture.id,
      images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
      isBestSeller: true,
      metaTitle: 'Ergonomic Office Chair - Premium Quality',
      publishedAt: new Date(),
    },
    {
      sku: 'MONITOR-001',
      name: '27" 4K Ultra HD Monitor',
      slug: '27-4k-monitor',
      description: '27-inch 4K UHD monitor with HDR support. Perfect for professionals and content creators.',
      shortDescription: '27" 4K monitor with HDR',
      status: ProductStatus.ACTIVE,
      basePrice: 549.99,
      cost: 300,
      wholesalePrice: 450,
      gsaPrice: 480,
      gsaSin: 'SIN-456-789',
      stockQuantity: 60,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
      isNewArrival: true,
      metaTitle: '27 inch 4K Ultra HD Monitor',
      publishedAt: new Date(),
    },
    {
      sku: 'KEYBOARD-001',
      name: 'Mechanical Keyboard RGB',
      slug: 'mechanical-keyboard-rgb',
      description: 'Premium mechanical keyboard with RGB backlight. Cherry MX switches for the best typing experience.',
      shortDescription: 'Mechanical keyboard with RGB',
      status: ProductStatus.ACTIVE,
      basePrice: 149.99,
      salePrice: 129.99,
      cost: 70,
      wholesalePrice: 110,
      gsaPrice: 120,
      stockQuantity: 100,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'],
      isFeatured: true,
      metaTitle: 'Mechanical Keyboard with RGB Backlight',
      publishedAt: new Date(),
    },
    {
      sku: 'MOUSE-001',
      name: 'Wireless Ergonomic Mouse',
      slug: 'wireless-ergonomic-mouse',
      description: 'Ergonomic wireless mouse with precision tracking. Rechargeable battery lasts up to 3 months.',
      shortDescription: 'Wireless ergonomic mouse',
      status: ProductStatus.ACTIVE,
      basePrice: 79.99,
      salePrice: 69.99,
      cost: 35,
      wholesalePrice: 60,
      gsaPrice: 65,
      stockQuantity: 150,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'],
      metaTitle: 'Wireless Ergonomic Mouse',
      publishedAt: new Date(),
    },
    {
      sku: 'PRINTER-001',
      name: 'Multifunction Laser Printer',
      slug: 'multifunction-laser-printer',
      description: 'All-in-one laser printer with print, scan, copy, and fax. Network-ready for office use.',
      shortDescription: 'All-in-one laser printer',
      status: ProductStatus.ACTIVE,
      basePrice: 399.99,
      cost: 200,
      wholesalePrice: 320,
      gsaPrice: 350,
      gsaSin: 'SIN-567-890',
      stockQuantity: 40,
      minimumOrderQty: 5,
      categoryId: officeSupplies.id,
      images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800'],
      metaTitle: 'Multifunction Laser Printer',
      publishedAt: new Date(),
    },
    {
      sku: 'WEBCAM-001',
      name: '1080p HD Webcam',
      slug: 'hd-webcam-1080p',
      description: 'Professional HD webcam with auto-focus and noise-canceling microphone. Perfect for video conferencing.',
      shortDescription: '1080p HD webcam with microphone',
      status: ProductStatus.ACTIVE,
      basePrice: 89.99,
      salePrice: 79.99,
      cost: 40,
      wholesalePrice: 70,
      gsaPrice: 75,
      stockQuantity: 120,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1588415823243-3c2e58984e40?w=800'],
      isNewArrival: true,
      metaTitle: '1080p HD Webcam for Video Conferencing',
      publishedAt: new Date(),
    },
    {
      sku: 'HEADSET-001',
      name: 'Wireless Noise-Canceling Headset',
      slug: 'wireless-noise-canceling-headset',
      description: 'Premium wireless headset with active noise cancellation. Perfect for calls and music.',
      shortDescription: 'Wireless headset with ANC',
      status: ProductStatus.ACTIVE,
      basePrice: 249.99,
      salePrice: 219.99,
      cost: 120,
      wholesalePrice: 200,
      gsaPrice: 215,
      stockQuantity: 80,
      categoryId: electronics.id,
      images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'],
      isBestSeller: true,
      metaTitle: 'Wireless Noise-Canceling Headset',
      publishedAt: new Date(),
    },
    {
      sku: 'DOCK-001',
      name: 'USB-C Docking Station',
      slug: 'usb-c-docking-station',
      description: 'Universal USB-C docking station with dual 4K display support, multiple ports, and 100W power delivery.',
      shortDescription: 'USB-C dock with dual 4K support',
      status: ProductStatus.ACTIVE,
      basePrice: 299.99,
      cost: 150,
      wholesalePrice: 250,
      gsaPrice: 270,
      gsaSin: 'SIN-678-901',
      stockQuantity: 45,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800'],
      isFeatured: true,
      metaTitle: 'USB-C Docking Station - Dual 4K',
      publishedAt: new Date(),
    },
    {
      sku: 'TABLET-001',
      name: 'Professional Business Tablet',
      slug: 'professional-business-tablet',
      description: '10-inch tablet with stylus support. Perfect for presentations and note-taking.',
      shortDescription: '10-inch tablet with stylus',
      status: ProductStatus.ACTIVE,
      basePrice: 649.99,
      salePrice: 599.99,
      cost: 350,
      wholesalePrice: 550,
      gsaPrice: 580,
      gsaSin: 'SIN-789-012',
      stockQuantity: 55,
      categoryId: computers.id,
      images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800'],
      isNewArrival: true,
      metaTitle: 'Professional Business Tablet',
      publishedAt: new Date(),
    },
    {
      sku: 'BACKPACK-001',
      name: 'Business Laptop Backpack',
      slug: 'business-laptop-backpack',
      description: 'Premium laptop backpack with TSA-friendly design. Fits up to 17-inch laptops.',
      shortDescription: 'TSA-friendly laptop backpack',
      status: ProductStatus.ACTIVE,
      basePrice: 89.99,
      salePrice: 79.99,
      cost: 40,
      wholesalePrice: 70,
      stockQuantity: 200,
      categoryId: officeSupplies.id,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
      metaTitle: 'Business Laptop Backpack - TSA Friendly',
      publishedAt: new Date(),
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ 12 Products created');

  // ============================================
  // DISCOUNTS
  // ============================================
  console.log('Creating discounts...');

  await prisma.discount.create({
    data: {
      code: 'WELCOME10',
      name: '10% Off Welcome Discount',
      description: 'Get 10% off your first order',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 10,
      minPurchase: 100,
      usageLimit: 1000,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      isActive: true,
      accountTypes: [AccountType.B2C],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'B2B20',
      name: 'B2B Bulk Discount',
      description: '20% off for B2B customers',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 20,
      minPurchase: 500,
      startsAt: new Date(),
      isActive: true,
      accountTypes: [AccountType.B2B],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'GOLDVIP',
      name: 'Gold Tier Exclusive',
      description: '15% off for Gold tier members',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 15,
      startsAt: new Date(),
      isActive: true,
      loyaltyTiers: [LoyaltyTier.GOLD, LoyaltyTier.PLATINUM, LoyaltyTier.DIAMOND],
    },
  });

  console.log('✅ Discounts created');

  // ============================================
  // SAMPLE ORDER
  // ============================================
  console.log('Creating sample order...');

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-00001',
      userId: customer.id,
      accountType: AccountType.B2C,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 1849.98,
      tax: 148.00,
      shipping: 15.00,
      discount: 184.99,
      total: 1827.99,
      paymentMethod: PaymentMethod.STRIPE,
      paymentIntentId: 'pi_test_123456',
      paidAt: new Date(),
      billingAddressId: customerAddress.id,
      shippingAddressId: customerAddress.id,
      shippingCarrier: 'FedEx',
      shippingMethod: 'Ground',
      trackingNumber: '1234567890',
      shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(),
      loyaltyPointsEarned: 182,
      items: {
        create: [
          {
            productId: (await prisma.product.findUnique({ where: { sku: 'LAPTOP-001' } }))!.id,
            sku: 'LAPTOP-001',
            name: 'Professional Business Laptop',
            quantity: 1,
            price: 1199.99,
            discount: 120.00,
            tax: 86.40,
            total: 1166.39,
          },
          {
            productId: (await prisma.product.findUnique({ where: { sku: 'MOUSE-001' } }))!.id,
            sku: 'MOUSE-001',
            name: 'Wireless Ergonomic Mouse',
            quantity: 1,
            price: 69.99,
            discount: 7.00,
            tax: 5.04,
            total: 68.03,
          },
          {
            productId: (await prisma.product.findUnique({ where: { sku: 'KEYBOARD-001' } }))!.id,
            sku: 'KEYBOARD-001',
            name: 'Mechanical Keyboard RGB',
            quantity: 1,
            price: 129.99,
            discount: 13.00,
            tax: 9.36,
            total: 126.35,
          },
        ],
      },
    },
  });

  console.log('✅ Sample order created');

  // ============================================
  // REVIEWS
  // ============================================
  console.log('Creating reviews...');

  const laptop = await prisma.product.findUnique({ where: { sku: 'LAPTOP-001' } });
  const chair = await prisma.product.findUnique({ where: { sku: 'CHAIR-001' } });

  if (laptop) {
    await prisma.review.create({
      data: {
        productId: laptop.id,
        userId: customer.id,
        rating: 5,
        title: 'Excellent laptop for business!',
        comment: 'This laptop exceeded my expectations. Fast, reliable, and perfect for my daily work tasks.',
        status: 'APPROVED',
        isVerified: true,
        helpfulCount: 12,
      },
    });
  }

  if (chair) {
    await prisma.review.create({
      data: {
        productId: chair.id,
        userId: customer.id,
        rating: 4,
        title: 'Very comfortable',
        comment: 'Great chair for long working hours. The lumbar support is excellent.',
        status: 'APPROVED',
        isVerified: true,
        helpfulCount: 8,
      },
    });
  }

  console.log('✅ Reviews created');

  // ============================================
  // SETTINGS
  // ============================================
  console.log('Creating system settings...');

  const settings = [
    { key: 'site_name', value: 'Enterprise E-commerce', category: 'general' },
    { key: 'site_email', value: 'info@ecommerce.com', category: 'general' },
    { key: 'currency', value: 'USD', category: 'general' },
    { key: 'tax_rate', value: '8.0', type: 'number', category: 'financial' },
    { key: 'free_shipping_threshold', value: '100', type: 'number', category: 'shipping' },
    { key: 'loyalty_points_ratio', value: '10', type: 'number', category: 'loyalty' },
    { key: 'enable_b2b', value: 'true', type: 'boolean', category: 'features' },
    { key: 'enable_gsa', value: 'true', type: 'boolean', category: 'features' },
    { key: 'enable_reviews', value: 'true', type: 'boolean', category: 'features' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Settings created');

  console.log('');
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('  Super Admin: superadmin@ecommerce.com / password123');
  console.log('  Admin: admin@ecommerce.com / password123');
  console.log('  Accountant: accountant@ecommerce.com / password123');
  console.log('  Customer: customer@example.com / password123');
  console.log('  B2B Customer: b2b@company.com / password123');
  console.log('  GSA Customer: gsa@agency.gov / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
