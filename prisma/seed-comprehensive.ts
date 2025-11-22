import { PrismaClient, UserRole, AccountType, LoyaltyTier, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, ShipmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed (US Standards)...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // USERS - All roles
  // ============================================
  console.log('Creating users with all roles...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@ecommerce.com' },
    update: {},
    create: {
      email: 'superadmin@ecommerce.com',
      password: hashedPassword,
      name: 'Michael Anderson',
      phone: '+14155551001',
      role: UserRole.SUPER_ADMIN,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      name: 'Sarah Thompson',
      phone: '+14155551002',
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
      name: 'Robert Chen',
      phone: '+14155551003',
      role: UserRole.ACCOUNTANT,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const warehouseManager = await prisma.user.upsert({
    where: { email: 'warehouse@ecommerce.com' },
    update: {},
    create: {
      email: 'warehouse@ecommerce.com',
      password: hashedPassword,
      name: 'James Wilson',
      phone: '+14155551004',
      role: UserRole.WAREHOUSE_MANAGER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const customerService = await prisma.user.upsert({
    where: { email: 'support@ecommerce.com' },
    update: {},
    create: {
      email: 'support@ecommerce.com',
      password: hashedPassword,
      name: 'Emily Davis',
      phone: '+14155551005',
      role: UserRole.CUSTOMER_SERVICE,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const marketingManager = await prisma.user.upsert({
    where: { email: 'marketing@ecommerce.com' },
    update: {},
    create: {
      email: 'marketing@ecommerce.com',
      password: hashedPassword,
      name: 'Jennifer Martinez',
      phone: '+14155551006',
      role: UserRole.MARKETING_MANAGER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  // B2C Customers
  const customer1 = await prisma.user.upsert({
    where: { email: 'john.doe@gmail.com' },
    update: {},
    create: {
      email: 'john.doe@gmail.com',
      password: hashedPassword,
      name: 'John Doe',
      phone: '+14155552001',
      role: UserRole.CUSTOMER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'jane.smith@gmail.com' },
    update: {},
    create: {
      email: 'jane.smith@gmail.com',
      password: hashedPassword,
      name: 'Jane Smith',
      phone: '+14155552002',
      role: UserRole.CUSTOMER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  // B2B Customer
  const b2bCustomer = await prisma.user.upsert({
    where: { email: 'purchasing@techcorp.com' },
    update: {},
    create: {
      email: 'purchasing@techcorp.com',
      password: hashedPassword,
      name: 'David Johnson',
      phone: '+14155553001',
      role: UserRole.B2B_CUSTOMER,
      accountType: AccountType.B2B,
      emailVerified: new Date(),
    },
  });

  // GSA Customer
  const gsaCustomer = await prisma.user.upsert({
    where: { email: 'procurement@gsa.gov' },
    update: {},
    create: {
      email: 'procurement@gsa.gov',
      password: hashedPassword,
      name: 'Patricia Williams',
      phone: '+12025551001',
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
    where: { userId: customer1.id },
    update: {},
    create: {
      userId: customer1.id,
      tier: LoyaltyTier.GOLD,
      points: 2500,
      lifetimePoints: 5000,
      lifetimeSpent: 8500,
    },
  });

  await prisma.loyaltyProfile.upsert({
    where: { userId: customer2.id },
    update: {},
    create: {
      userId: customer2.id,
      tier: LoyaltyTier.SILVER,
      points: 800,
      lifetimePoints: 1500,
      lifetimeSpent: 2200,
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
      companyName: 'TechCorp Solutions Inc.',
      taxId: '12-3456789', // EIN format
      businessLicense: 'CA-BL-2024-001234',
      creditLimit: 100000,
      creditUsed: 25000,
      creditAvailable: 75000,
      paymentTerms: 30,
      discountPercent: 18,
      status: 'APPROVED',
      approvedAt: new Date('2024-01-15'),
      approvedBy: superAdmin.id,
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
      gsaSchedule: 'Schedule 70 - IT',
      vendorId: 'V123456789',
      cageCode: '1ABC2',
      dunsBradstreet: '123456789',
      fiscalYear: '2024',
      isActive: true,
    },
  });

  console.log('✅ GSA profile created');

  // ============================================
  // ADDRESSES (US Format)
  // ============================================
  console.log('Creating US addresses...');

  // Customer 1 addresses (California)
  const customer1BillingAddr = await prisma.address.create({
    data: {
      userId: customer1.id,
      type: 'BILLING',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Market Street',
      address2: 'Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      phone: '+14155552001',
      isDefault: true,
      isVerified: true,
    },
  });

  const customer1ShippingAddr = await prisma.address.create({
    data: {
      userId: customer1.id,
      type: 'SHIPPING',
      firstName: 'John',
      lastName: 'Doe',
      address1: '456 Oak Avenue',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95110',
      country: 'USA',
      phone: '+14085551234',
      isDefault: true,
      isVerified: true,
    },
  });

  // Customer 2 addresses (New York)
  const customer2Addr = await prisma.address.create({
    data: {
      userId: customer2.id,
      type: 'BOTH',
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '789 Broadway',
      address2: 'Suite 1200',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      country: 'USA',
      phone: '+12125551234',
      isDefault: true,
      isVerified: true,
    },
  });

  // B2B address (Texas)
  const b2bAddr = await prisma.address.create({
    data: {
      userId: b2bCustomer.id,
      type: 'BOTH',
      firstName: 'David',
      lastName: 'Johnson',
      company: 'TechCorp Solutions Inc.',
      address1: '1000 Technology Drive',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA',
      phone: '+15125551000',
      isDefault: true,
      isVerified: true,
    },
  });

  // GSA address (Washington DC)
  const gsaAddr = await prisma.address.create({
    data: {
      userId: gsaCustomer.id,
      type: 'BOTH',
      firstName: 'Patricia',
      lastName: 'Williams',
      company: 'General Services Administration',
      address1: '1800 F Street NW',
      city: 'Washington',
      state: 'DC',
      zipCode: '20405',
      country: 'USA',
      phone: '+12025551001',
      isDefault: true,
      isVerified: true,
    },
  });

  console.log('✅ Addresses created');

  // ============================================
  // CATEGORIES
  // ============================================
  console.log('Creating product categories...');

  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices, computers, and accessories',
      isActive: true,
      order: 1,
    },
  });

  const computers = await prisma.category.create({
    data: {
      name: 'Computers & Laptops',
      slug: 'computers-laptops',
      description: 'Desktop computers, laptops, and related accessories',
      parentId: electronics.id,
      isActive: true,
      order: 1,
    },
  });

  const officeSupplies = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      slug: 'office-supplies',
      description: 'Office furniture, stationery, and business supplies',
      isActive: true,
      order: 2,
    },
  });

  const furniture = await prisma.category.create({
    data: {
      name: 'Office Furniture',
      slug: 'office-furniture',
      description: 'Desks, chairs, and ergonomic office furniture',
      parentId: officeSupplies.id,
      isActive: true,
      order: 1,
    },
  });

  console.log('✅ Categories created');

  // ============================================
  // PRODUCTS (15 Products with US specifications)
  // ============================================
  console.log('Creating products with US pricing and specs...');

  const products = await Promise.all([
    // Laptops
    prisma.product.create({
      data: {
        sku: 'LAPTOP-PRO-001',
        name: 'Professional Business Laptop Pro 15',
        slug: 'professional-business-laptop-pro-15',
        description: 'High-performance laptop perfect for business professionals. Intel Core i7-13700H processor, 16GB DDR5 RAM, 512GB NVMe SSD. 15.6" Full HD IPS display. Windows 11 Pro. Weight: 3.5 lbs.',
        shortDescription: 'Intel i7, 16GB RAM, 512GB SSD, 15.6" FHD',
        status: ProductStatus.ACTIVE,
        basePrice: 1299.99,
        salePrice: 1199.99,
        cost: 850.00,
        wholesalePrice: 1050.00,
        gsaPrice: 1150.00,
        gsaSin: 'SIN-132-51',
        stockQuantity: 50,
        lowStockAlert: 10,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
        weight: 3.5,
        dimensions: '{"length": 14.1, "width": 9.3, "height": 0.7}',
        isFeatured: true,
        isBestSeller: true,
        metaTitle: 'Professional Business Laptop Pro 15 - High Performance',
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'LAPTOP-ULT-002',
        name: 'Ultrabook Elite 14',
        slug: 'ultrabook-elite-14',
        description: 'Ultra-portable laptop with premium build. Intel Core i5-1340P, 8GB RAM, 256GB SSD. 14" FHD touchscreen. All-day battery life. Weight: 2.8 lbs.',
        shortDescription: 'Ultraportable, Intel i5, 8GB, 256GB, 14" Touch',
        status: ProductStatus.ACTIVE,
        basePrice: 899.99,
        cost: 600.00,
        wholesalePrice: 750.00,
        gsaPrice: 820.00,
        gsaSin: 'SIN-132-52',
        stockQuantity: 35,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
        weight: 2.8,
        dimensions: '{"length": 12.8, "width": 8.9, "height": 0.6}',
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // Office Furniture
    prisma.product.create({
      data: {
        sku: 'DESK-STAND-001',
        name: 'Executive Standing Desk Adjustable Height',
        slug: 'executive-standing-desk-adjustable',
        description: 'Premium electric standing desk with memory presets. 60"x30" desktop. Height range: 28"-48". Dual motor system. 350 lbs capacity. Cable management tray included.',
        shortDescription: 'Electric standing desk, 60x30, dual motor, memory presets',
        status: ProductStatus.ACTIVE,
        basePrice: 799.99,
        salePrice: 699.99,
        cost: 420.00,
        wholesalePrice: 620.00,
        gsaPrice: 650.00,
        gsaSin: 'SIN-711-1',
        stockQuantity: 30,
        minimumOrderQty: 1,
        categoryId: furniture.id,
        images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800'],
        weight: 95.0,
        dimensions: '{"length": 60, "width": 30, "height": 1.5}',
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'CHAIR-ERG-001',
        name: 'Ergonomic Office Chair Premium Mesh',
        slug: 'ergonomic-office-chair-premium-mesh',
        description: 'High-back ergonomic chair with lumbar support. Breathable mesh back. Adjustable armrests, seat height, and tilt. 300 lbs capacity. BIFMA certified.',
        shortDescription: 'Ergonomic mesh chair, lumbar support, adjustable',
        status: ProductStatus.ACTIVE,
        basePrice: 449.99,
        salePrice: 399.99,
        cost: 220.00,
        wholesalePrice: 350.00,
        gsaPrice: 380.00,
        gsaSin: 'SIN-711-2',
        stockQuantity: 75,
        categoryId: furniture.id,
        images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
        weight: 45.0,
        dimensions: '{"length": 28, "width": 28, "height": 48}',
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    // Monitors
    prisma.product.create({
      data: {
        sku: 'MONITOR-4K-001',
        name: '27" 4K UHD Professional Monitor',
        slug: '27-4k-uhd-professional-monitor',
        description: '27-inch 4K UHD (3840x2160) IPS monitor. HDR10 support. 99% sRGB color accuracy. USB-C connectivity with 65W power delivery. VESA mountable.',
        shortDescription: '27" 4K IPS, HDR10, USB-C, 99% sRGB',
        status: ProductStatus.ACTIVE,
        basePrice: 549.99,
        cost: 320.00,
        wholesalePrice: 450.00,
        gsaPrice: 480.00,
        gsaSin: 'SIN-132-33',
        stockQuantity: 60,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
        weight: 12.5,
        dimensions: '{"length": 24.1, "width": 8.7, "height": 14.3}',
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // Keyboards & Mice
    prisma.product.create({
      data: {
        sku: 'KEYBOARD-MECH-001',
        name: 'Mechanical Keyboard RGB Backlit',
        slug: 'mechanical-keyboard-rgb-backlit',
        description: 'Full-size mechanical keyboard with RGB backlighting. Cherry MX Brown switches. Aluminum frame. N-key rollover. Detachable USB-C cable.',
        shortDescription: 'Mechanical keyboard, RGB, Cherry MX Brown',
        status: ProductStatus.ACTIVE,
        basePrice: 149.99,
        salePrice: 129.99,
        cost: 75.00,
        wholesalePrice: 110.00,
        gsaPrice: 120.00,
        stockQuantity: 100,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'],
        weight: 2.2,
        dimensions: '{"length": 17.5, "width": 5.5, "height": 1.5}',
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'MOUSE-WL-001',
        name: 'Wireless Ergonomic Mouse Pro',
        slug: 'wireless-ergonomic-mouse-pro',
        description: 'Vertical ergonomic wireless mouse. 6 programmable buttons. Up to 4000 DPI. Rechargeable battery lasts 3 months. Works on any surface.',
        shortDescription: 'Wireless ergonomic mouse, 4000 DPI, rechargeable',
        status: ProductStatus.ACTIVE,
        basePrice: 79.99,
        salePrice: 69.99,
        cost: 38.00,
        wholesalePrice: 60.00,
        gsaPrice: 65.00,
        stockQuantity: 150,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'],
        weight: 0.3,
        dimensions: '{"length": 4.7, "width": 3.1, "height": 2.9}',
        publishedAt: new Date(),
      },
    }),

    // Printers
    prisma.product.create({
      data: {
        sku: 'PRINTER-LASER-001',
        name: 'Multifunction Laser Printer All-in-One',
        slug: 'multifunction-laser-printer-all-in-one',
        description: 'Color laser all-in-one printer. Print, scan, copy, fax. 30 ppm. Duplex printing. Wireless networking. 250-sheet tray. Monthly duty cycle: 50,000 pages.',
        shortDescription: 'Color laser MFP, 30ppm, wireless, duplex',
        status: ProductStatus.ACTIVE,
        basePrice: 499.99,
        cost: 280.00,
        wholesalePrice: 400.00,
        gsaPrice: 430.00,
        gsaSin: 'SIN-132-8',
        stockQuantity: 40,
        minimumOrderQty: 1,
        categoryId: officeSupplies.id,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800'],
        weight: 48.5,
        dimensions: '{"length": 19.3, "width": 18.5, "height": 15.4}',
        publishedAt: new Date(),
      },
    }),

    // Webcams & Headsets
    prisma.product.create({
      data: {
        sku: 'WEBCAM-HD-001',
        name: '1080p HD Webcam with Microphone',
        slug: '1080p-hd-webcam-with-microphone',
        description: 'Full HD 1080p webcam with auto-focus. Dual stereo microphones with noise reduction. 90-degree field of view. USB plug-and-play. Works with all video conferencing apps.',
        shortDescription: '1080p webcam, auto-focus, dual mics, 90° FOV',
        status: ProductStatus.ACTIVE,
        basePrice: 89.99,
        salePrice: 79.99,
        cost: 42.00,
        wholesalePrice: 70.00,
        gsaPrice: 75.00,
        stockQuantity: 120,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1588415823243-3c2e58984e40?w=800'],
        weight: 0.4,
        dimensions: '{"length": 3.7, "width": 2.8, "height": 2.2}',
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'HEADSET-WNC-001',
        name: 'Wireless Noise-Canceling Headset Professional',
        slug: 'wireless-noise-canceling-headset-professional',
        description: 'Premium wireless headset with active noise cancellation. 40mm drivers. Bluetooth 5.2. Up to 30 hours battery life. Boom microphone with mute button. Comfortable memory foam ear cushions.',
        shortDescription: 'Wireless ANC headset, 30hr battery, boom mic',
        status: ProductStatus.ACTIVE,
        basePrice: 249.99,
        salePrice: 219.99,
        cost: 125.00,
        wholesalePrice: 200.00,
        gsaPrice: 215.00,
        stockQuantity: 80,
        categoryId: electronics.id,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'],
        weight: 0.7,
        dimensions: '{"length": 7.5, "width": 3.5, "height": 7.8}',
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    // Docking Stations
    prisma.product.create({
      data: {
        sku: 'DOCK-USBC-001',
        name: 'USB-C Docking Station Dual 4K',
        slug: 'usb-c-docking-station-dual-4k',
        description: 'Universal USB-C docking station supports dual 4K displays at 60Hz. 100W power delivery for laptop charging. 6x USB 3.0 ports, Ethernet, audio. Compatible with Windows, Mac, Chrome OS.',
        shortDescription: 'USB-C dock, dual 4K, 100W PD, 6x USB',
        status: ProductStatus.ACTIVE,
        basePrice: 299.99,
        cost: 165.00,
        wholesalePrice: 250.00,
        gsaPrice: 270.00,
        gsaSin: 'SIN-132-39',
        stockQuantity: 45,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800'],
        weight: 1.5,
        dimensions: '{"length": 7.9, "width": 3.5, "height": 1.2}',
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    // Tablets
    prisma.product.create({
      data: {
        sku: 'TABLET-PRO-001',
        name: 'Professional Business Tablet 12.9"',
        slug: 'professional-business-tablet-129',
        description: '12.9-inch tablet with stylus support. Octa-core processor, 8GB RAM, 256GB storage. 2732x2048 resolution. Keyboard compatible. Perfect for presentations and note-taking. Weight: 1.4 lbs.',
        shortDescription: '12.9" tablet, stylus support, 8GB/256GB',
        status: ProductStatus.ACTIVE,
        basePrice: 849.99,
        salePrice: 799.99,
        cost: 480.00,
        wholesalePrice: 700.00,
        gsaPrice: 750.00,
        gsaSin: 'SIN-132-45',
        stockQuantity: 55,
        categoryId: computers.id,
        images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800'],
        weight: 1.4,
        dimensions: '{"length": 11.0, "width": 8.5, "height": 0.25}',
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // Bags
    prisma.product.create({
      data: {
        sku: 'BACKPACK-LAPTOP-001',
        name: 'Business Laptop Backpack TSA-Friendly',
        slug: 'business-laptop-backpack-tsa-friendly',
        description: 'Premium laptop backpack with TSA-friendly design. Fits up to 17-inch laptops. Water-resistant material. Multiple compartments. USB charging port. Anti-theft back pocket. Comfortable padded straps.',
        shortDescription: 'TSA laptop backpack, up to 17", water-resistant',
        status: ProductStatus.ACTIVE,
        basePrice: 89.99,
        salePrice: 79.99,
        cost: 42.00,
        wholesalePrice: 70.00,
        stockQuantity: 200,
        categoryId: officeSupplies.id,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
        weight: 2.1,
        dimensions: '{"length": 18, "width": 12, "height": 7}',
        publishedAt: new Date(),
      },
    }),

    // Power & Cables
    prisma.product.create({
      data: {
        sku: 'CHARGER-GAN-001',
        name: '100W GaN USB-C Charger Multi-Port',
        slug: '100w-gan-usb-c-charger-multi-port',
        description: 'Compact 100W GaN charger with 3 ports (2x USB-C, 1x USB-A). Charges laptops, tablets, and phones simultaneously. Foldable plug. Universal voltage (100-240V). Includes 6ft USB-C cable.',
        shortDescription: '100W GaN charger, 3-port, foldable, cable included',
        status: ProductStatus.ACTIVE,
        basePrice: 69.99,
        cost: 32.00,
        wholesalePrice: 55.00,
        gsaPrice: 60.00,
        stockQuantity: 150,
        categoryId: electronics.id,
        images: ['https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=100W+GaN+Charger'],
        weight: 0.5,
        dimensions: '{"length": 2.8, "width": 2.8, "height": 1.2}',
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'SURGE-PROT-001',
        name: 'Surge Protector Power Strip 12-Outlet',
        slug: 'surge-protector-power-strip-12-outlet',
        description: '12-outlet surge protector with 4 USB ports. 4000 Joules protection. 8-foot heavy-duty cord. Overload protection. Wall mountable. UL Listed. $100,000 connected equipment warranty.',
        shortDescription: '12-outlet surge protector, 4 USB, 4000J, 8ft cord',
        status: ProductStatus.ACTIVE,
        basePrice: 49.99,
        cost: 22.00,
        wholesalePrice: 38.00,
        gsaPrice: 42.00,
        stockQuantity: 180,
        categoryId: electronics.id,
        images: ['https://via.placeholder.com/800x600/2ECC71/FFFFFF?text=Surge+Protector'],
        weight: 2.8,
        dimensions: '{"length": 15, "width": 3.5, "height": 1.5}',
        publishedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${products.length} Products created with US pricing and specifications`);

  // ============================================
  // DISCOUNTS
  // ============================================
  console.log('Creating discount codes...');

  await prisma.discount.create({
    data: {
      code: 'WELCOME10',
      name: '10% Off Welcome Discount',
      description: 'Get 10% off your first order',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 10,
      minPurchase: 100,
      usageLimit: 10000,
      perUserLimit: 1,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      accountTypes: [AccountType.B2C],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'B2B20',
      name: 'B2B Wholesale Discount',
      description: '20% off for B2B customers',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 20,
      minPurchase: 1000,
      startsAt: new Date(),
      isActive: true,
      accountTypes: [AccountType.B2B],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'LOYALTY15',
      name: 'Gold Tier Member Exclusive',
      description: '15% off for Gold, Platinum, and Diamond members',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 15,
      startsAt: new Date(),
      isActive: true,
      loyaltyTiers: [LoyaltyTier.GOLD, LoyaltyTier.PLATINUM, LoyaltyTier.DIAMOND],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'FREESHIP',
      name: 'Free Standard Shipping',
      description: 'Free standard shipping on orders over $50',
      type: 'FREE_SHIPPING',
      scope: 'GLOBAL',
      value: 0,
      minPurchase: 50,
      startsAt: new Date(),
      isActive: true,
      accountTypes: [AccountType.B2C],
    },
  });

  console.log('✅ Discounts created');

  // ============================================
  // COMPREHENSIVE ORDERS WITH SHIPPING & PAYMENTS
  // ============================================
  console.log('Creating comprehensive orders with shipping and payments...');

  // Order 1: B2C Customer - Delivered with FedEx
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-00001',
      userId: customer1.id,
      accountType: AccountType.B2C,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 2349.97,
      tax: 187.99,
      shipping: 15.99,
      discount: 235.00,
      total: 2318.95,
      taxRate: 8.00,
      taxableAmount: 2349.97,
      paymentMethod: PaymentMethod.STRIPE,
      paymentIntentId: 'pi_3QA1B2C3D4E5F6G7H8I9J0K1',
      paidAt: new Date('2024-11-15T10:30:00Z'),
      billingAddressId: customer1BillingAddr.id,
      shippingAddressId: customer1ShippingAddr.id,
      shippingCarrier: 'FEDEX',
      shippingMethod: 'FEDEX_GROUND',
      trackingNumber: '7961234567890',
      shippedAt: new Date('2024-11-16T09:00:00Z'),
      deliveredAt: new Date('2024-11-20T14:30:00Z'),
      estimatedDelivery: new Date('2024-11-21T23:59:59Z'),
      loyaltyPointsEarned: 232,
      discountCodes: ['WELCOME10'],
      createdAt: new Date('2024-11-15T10:25:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            sku: products[0].sku,
            name: products[0].name,
            quantity: 1,
            price: 1199.99,
            discount: 120.00,
            tax: 86.40,
            total: 1166.39,
          },
          {
            productId: products[4].id,
            sku: products[4].sku,
            name: products[4].name,
            quantity: 1,
            price: 549.99,
            discount: 55.00,
            tax: 39.60,
            total: 534.59,
          },
          {
            productId: products[9].id,
            sku: products[9].sku,
            name: products[9].name,
            quantity: 2,
            price: 299.99,
            discount: 60.00,
            tax: 38.40,
            total: 578.38,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: OrderStatus.PENDING,
            notes: 'Order placed',
            createdAt: new Date('2024-11-15T10:25:00Z'),
          },
          {
            status: OrderStatus.CONFIRMED,
            notes: 'Payment confirmed',
            changedBy: admin.id,
            createdAt: new Date('2024-11-15T10:30:00Z'),
          },
          {
            status: OrderStatus.PROCESSING,
            notes: 'Order being prepared',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-16T08:00:00Z'),
          },
          {
            status: OrderStatus.SHIPPED,
            notes: 'Shipped via FedEx Ground',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-16T09:00:00Z'),
          },
          {
            status: OrderStatus.DELIVERED,
            notes: 'Delivered and signed by customer',
            createdAt: new Date('2024-11-20T14:30:00Z'),
          },
        ],
      },
    },
  });

  // Create shipment for Order 1
  const shipment1 = await prisma.shipment.create({
    data: {
      orderId: order1.id,
      carrier: 'FEDEX',
      service: 'FEDEX_GROUND',
      trackingNumber: '7961234567890',
      status: ShipmentStatus.DELIVERED,
      labelCreatedAt: new Date('2024-11-16T08:45:00Z'),
      shippedAt: new Date('2024-11-16T09:00:00Z'),
      deliveredAt: new Date('2024-11-20T14:30:00Z'),
      estimatedDelivery: new Date('2024-11-21T23:59:59Z'),
      weight: 8.5,
      length: 20.0,
      width: 16.0,
      height: 12.0,
      cost: 15.99,
      insuranceAmount: 2500.00,
      labelUrl: 'https://example.com/labels/order1.pdf',
      labelFormat: 'PDF',
      requireSignature: true,
      signedBy: 'J. Doe',
      tracking: {
        create: [
          {
            status: 'Label Created',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            message: 'Shipping label created',
            timestamp: new Date('2024-11-16T08:45:00Z'),
          },
          {
            status: 'Picked Up',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            message: 'Package picked up by FedEx',
            timestamp: new Date('2024-11-16T09:00:00Z'),
          },
          {
            status: 'In Transit',
            location: 'Oakland, CA',
            city: 'Oakland',
            state: 'CA',
            zipCode: '94601',
            country: 'USA',
            message: 'Departed FedEx location',
            timestamp: new Date('2024-11-17T05:30:00Z'),
          },
          {
            status: 'In Transit',
            location: 'San Jose, CA',
            city: 'San Jose',
            state: 'CA',
            zipCode: '95101',
            country: 'USA',
            message: 'Arrived at FedEx facility',
            timestamp: new Date('2024-11-19T18:45:00Z'),
          },
          {
            status: 'Out for Delivery',
            location: 'San Jose, CA',
            city: 'San Jose',
            state: 'CA',
            zipCode: '95110',
            country: 'USA',
            message: 'On FedEx vehicle for delivery',
            timestamp: new Date('2024-11-20T07:30:00Z'),
          },
          {
            status: 'Delivered',
            location: 'San Jose, CA',
            city: 'San Jose',
            state: 'CA',
            zipCode: '95110',
            country: 'USA',
            message: 'Delivered and signed for',
            timestamp: new Date('2024-11-20T14:30:00Z'),
          },
        ],
      },
    },
  });

  // Create invoice and payment for Order 1
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-202411-00001',
      orderId: order1.id,
      status: 'PAID',
      subtotal: 2349.97,
      tax: 187.99,
      shipping: 15.99,
      discount: 235.00,
      total: 2318.95,
      amountPaid: 2318.95,
      amountDue: 0,
      issuedAt: new Date('2024-11-15T10:30:00Z'),
      dueAt: new Date('2024-11-15T10:30:00Z'),
      paidAt: new Date('2024-11-15T10:30:00Z'),
      termsConditions: 'Payment due upon receipt. All sales final.',
      payments: {
        create: {
          amount: 2318.95,
          method: 'Stripe',
          transactionId: 'pi_3QA1B2C3D4E5F6G7H8I9J0K1',
          reference: 'ch_3QA1B2C3D4E5F6G7H8I9J0K1',
          paidAt: new Date('2024-11-15T10:30:00Z'),
        },
      },
    },
  });

  // Order 2: B2B Customer - In Transit with UPS
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-00002',
      userId: b2bCustomer.id,
      accountType: AccountType.B2B,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.AUTHORIZED,
      subtotal: 15750.00,
      tax: 0, // B2B tax-exempt
      shipping: 125.00,
      discount: 3150.00,
      total: 12725.00,
      taxRate: 0,
      taxableAmount: 0,
      paymentMethod: PaymentMethod.NET_TERMS,
      purchaseOrderNumber: 'PO-TECH-2024-1156',
      paymentDueDate: new Date('2024-12-25T23:59:59Z'),
      billingAddressId: b2bAddr.id,
      shippingAddressId: b2bAddr.id,
      shippingCarrier: 'UPS',
      shippingMethod: 'UPS_GROUND',
      trackingNumber: '1Z999AA10123456784',
      shippedAt: new Date('2024-11-25T10:00:00Z'),
      estimatedDelivery: new Date('2024-11-29T23:59:59Z'),
      loyaltyPointsEarned: 0,
      discountCodes: [],
      customerNotes: 'Please deliver to loading dock at rear entrance',
      createdAt: new Date('2024-11-22T14:20:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            sku: products[0].sku,
            name: products[0].name,
            quantity: 10,
            price: 1050.00, // B2B wholesale price
            discount: 2100.00,
            tax: 0,
            total: 8400.00,
          },
          {
            productId: products[2].id,
            sku: products[2].sku,
            name: products[2].name,
            quantity: 5,
            price: 620.00, // B2B wholesale price
            discount: 620.00,
            tax: 0,
            total: 2480.00,
          },
          {
            productId: products[3].id,
            sku: products[3].sku,
            name: products[3].name,
            quantity: 10,
            price: 350.00, // B2B wholesale price
            discount: 350.00,
            tax: 0,
            total: 3150.00,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: OrderStatus.PENDING,
            notes: 'B2B order submitted with PO',
            createdAt: new Date('2024-11-22T14:20:00Z'),
          },
          {
            status: OrderStatus.CONFIRMED,
            notes: 'Purchase order validated, Net 30 terms',
            changedBy: admin.id,
            createdAt: new Date('2024-11-22T15:00:00Z'),
          },
          {
            status: OrderStatus.PROCESSING,
            notes: 'Bulk order being prepared',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-23T08:00:00Z'),
          },
          {
            status: OrderStatus.SHIPPED,
            notes: 'Shipped via UPS Ground - freight',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-25T10:00:00Z'),
          },
        ],
      },
    },
  });

  // Create shipment for Order 2
  const shipment2 = await prisma.shipment.create({
    data: {
      orderId: order2.id,
      carrier: 'UPS',
      service: 'UPS_GROUND',
      trackingNumber: '1Z999AA10123456784',
      status: ShipmentStatus.IN_TRANSIT,
      labelCreatedAt: new Date('2024-11-25T09:30:00Z'),
      shippedAt: new Date('2024-11-25T10:00:00Z'),
      estimatedDelivery: new Date('2024-11-29T23:59:59Z'),
      weight: 185.0,
      length: 48.0,
      width: 36.0,
      height: 24.0,
      cost: 125.00,
      insuranceAmount: 15000.00,
      labelUrl: 'https://example.com/labels/order2.pdf',
      labelFormat: 'PDF',
      requireSignature: true,
      tracking: {
        create: [
          {
            status: 'Label Created',
            location: 'Austin, TX',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            country: 'USA',
            message: 'Shipping label created',
            timestamp: new Date('2024-11-25T09:30:00Z'),
          },
          {
            status: 'Picked Up',
            location: 'Austin, TX',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            country: 'USA',
            message: 'Package picked up by UPS',
            timestamp: new Date('2024-11-25T10:00:00Z'),
          },
          {
            status: 'In Transit',
            location: 'Dallas, TX',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            country: 'USA',
            message: 'Departed UPS facility',
            timestamp: new Date('2024-11-26T08:15:00Z'),
          },
          {
            status: 'In Transit',
            location: 'Memphis, TN',
            city: 'Memphis',
            state: 'TN',
            zipCode: '38101',
            country: 'USA',
            message: 'Arrived at UPS hub',
            timestamp: new Date('2024-11-27T14:30:00Z'),
          },
        ],
      },
    },
  });

  // Create invoice for Order 2 (Net 30 terms)
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-202411-00002',
      orderId: order2.id,
      status: 'SENT',
      subtotal: 15750.00,
      tax: 0,
      shipping: 125.00,
      discount: 3150.00,
      total: 12725.00,
      amountPaid: 0,
      amountDue: 12725.00,
      issuedAt: new Date('2024-11-22T15:00:00Z'),
      dueAt: new Date('2024-12-25T23:59:59Z'),
      termsConditions: 'Net 30 days. Payment due by December 25, 2024.',
      notes: 'Purchase Order: PO-TECH-2024-1156',
    },
  });

  // Order 3: GSA Customer - Delivered with USPS Priority
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-00003',
      userId: gsaCustomer.id,
      accountType: AccountType.GSA,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 9200.00,
      tax: 0, // GSA tax-exempt
      shipping: 0, // Free shipping for GSA
      discount: 0,
      total: 9200.00,
      taxRate: 0,
      taxableAmount: 0,
      paymentMethod: PaymentMethod.GSA_SMARTPAY,
      paymentIntentId: 'gsa_card_3QX7Y8Z9A0B1C2D3E4F5G6H7',
      paidAt: new Date('2024-11-10T09:15:00Z'),
      gsaContractNumber: 'GS-00F-0001X',
      billingAddressId: gsaAddr.id,
      shippingAddressId: gsaAddr.id,
      shippingCarrier: 'USPS',
      shippingMethod: 'PRIORITY_MAIL',
      trackingNumber: '9400111899563824718956',
      shippedAt: new Date('2024-11-11T13:00:00Z'),
      deliveredAt: new Date('2024-11-14T11:20:00Z'),
      estimatedDelivery: new Date('2024-11-15T23:59:59Z'),
      loyaltyPointsEarned: 0,
      discountCodes: [],
      customerNotes: 'GSA Purchase - Deliver to Mailroom',
      createdAt: new Date('2024-11-10T09:10:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            sku: products[0].sku,
            name: products[0].name,
            quantity: 5,
            price: 1150.00, // GSA contract price
            discount: 0,
            tax: 0,
            total: 5750.00,
          },
          {
            productId: products[4].id,
            sku: products[4].sku,
            name: products[4].name,
            quantity: 5,
            price: 480.00, // GSA contract price
            discount: 0,
            tax: 0,
            total: 2400.00,
          },
          {
            productId: products[10].id,
            sku: products[10].sku,
            name: products[10].name,
            quantity: 4,
            price: 270.00, // GSA contract price
            discount: 0,
            tax: 0,
            total: 1080.00,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            status: OrderStatus.PENDING,
            notes: 'GSA order placed',
            createdAt: new Date('2024-11-10T09:10:00Z'),
          },
          {
            status: OrderStatus.CONFIRMED,
            notes: 'GSA SmartPay payment confirmed',
            changedBy: admin.id,
            createdAt: new Date('2024-11-10T09:15:00Z'),
          },
          {
            status: OrderStatus.PROCESSING,
            notes: 'Order being prepared per GSA requirements',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-11T08:00:00Z'),
          },
          {
            status: OrderStatus.SHIPPED,
            notes: 'Shipped via USPS Priority Mail',
            changedBy: warehouseManager.id,
            createdAt: new Date('2024-11-11T13:00:00Z'),
          },
          {
            status: OrderStatus.DELIVERED,
            notes: 'Delivered to GSA facility mailroom',
            createdAt: new Date('2024-11-14T11:20:00Z'),
          },
        ],
      },
    },
  });

  // Create shipment for Order 3
  const shipment3 = await prisma.shipment.create({
    data: {
      orderId: order3.id,
      carrier: 'USPS',
      service: 'PRIORITY_MAIL',
      trackingNumber: '9400111899563824718956',
      status: ShipmentStatus.DELIVERED,
      labelCreatedAt: new Date('2024-11-11T12:30:00Z'),
      shippedAt: new Date('2024-11-11T13:00:00Z'),
      deliveredAt: new Date('2024-11-14T11:20:00Z'),
      estimatedDelivery: new Date('2024-11-15T23:59:59Z'),
      weight: 22.5,
      length: 24.0,
      width: 18.0,
      height: 14.0,
      cost: 0,
      insuranceAmount: 10000.00,
      labelUrl: 'https://example.com/labels/order3.pdf',
      labelFormat: 'PDF',
      requireSignature: true,
      signedBy: 'GSA Mailroom',
      tracking: {
        create: [
          {
            status: 'Label Created',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            message: 'USPS awaiting item',
            timestamp: new Date('2024-11-11T12:30:00Z'),
          },
          {
            status: 'Accepted',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            message: 'Accepted at USPS facility',
            timestamp: new Date('2024-11-11T13:00:00Z'),
          },
          {
            status: 'In Transit',
            location: 'San Jose, CA',
            city: 'San Jose',
            state: 'CA',
            zipCode: '95101',
            country: 'USA',
            message: 'In transit to next facility',
            timestamp: new Date('2024-11-12T06:45:00Z'),
          },
          {
            status: 'In Transit',
            location: 'Baltimore, MD',
            city: 'Baltimore',
            state: 'MD',
            zipCode: '21201',
            country: 'USA',
            message: 'Arrived at USPS regional facility',
            timestamp: new Date('2024-11-13T14:20:00Z'),
          },
          {
            status: 'Out for Delivery',
            location: 'Washington, DC',
            city: 'Washington',
            state: 'DC',
            zipCode: '20405',
            country: 'USA',
            message: 'Out for delivery',
            timestamp: new Date('2024-11-14T08:00:00Z'),
          },
          {
            status: 'Delivered',
            location: 'Washington, DC',
            city: 'Washington',
            state: 'DC',
            zipCode: '20405',
            country: 'USA',
            message: 'Delivered, signed by mailroom',
            timestamp: new Date('2024-11-14T11:20:00Z'),
          },
        ],
      },
    },
  });

  // Create invoice and payment for Order 3
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-202411-00003',
      orderId: order3.id,
      status: 'PAID',
      subtotal: 9200.00,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 9200.00,
      amountPaid: 9200.00,
      amountDue: 0,
      issuedAt: new Date('2024-11-10T09:15:00Z'),
      dueAt: new Date('2024-11-10T09:15:00Z'),
      paidAt: new Date('2024-11-10T09:15:00Z'),
      termsConditions: 'GSA contract GS-00F-0001X. Payment via GSA SmartPay.',
      notes: 'GSA Advantage purchase',
      payments: {
        create: {
          amount: 9200.00,
          method: 'GSA SmartPay',
          transactionId: 'gsa_card_3QX7Y8Z9A0B1C2D3E4F5G6H7',
          reference: 'GSA-2024-11-10-001',
          paidAt: new Date('2024-11-10T09:15:00Z'),
        },
      },
    },
  });

  console.log('✅ 3 Comprehensive orders created with full shipping and payment details');

  // ============================================
  // REVIEWS
  // ============================================
  console.log('Creating product reviews...');

  await prisma.review.create({
    data: {
      productId: products[0].id,
      userId: customer1.id,
      orderId: order1.id,
      rating: 5,
      title: 'Excellent laptop for business use!',
      comment: 'This laptop exceeded my expectations. The performance is outstanding for business applications, video calls are crystal clear with the webcam, and the battery easily lasts a full work day. Setup was quick and it came with Windows 11 Pro pre-installed. Highly recommended for professionals!',
      status: 'APPROVED',
      isVerified: true,
      helpfulCount: 24,
      createdAt: new Date('2024-11-22T15:30:00Z'),
    },
  });

  await prisma.review.create({
    data: {
      productId: products[3].id,
      userId: customer1.id,
      orderId: order1.id,
      rating: 4,
      title: 'Very comfortable for long hours',
      comment: 'Great ergonomic chair with excellent lumbar support. I sit for 8-10 hours daily and this chair has significantly reduced my back pain. The mesh back keeps me cool. Only giving 4 stars because the armrests could be slightly more adjustable, but overall very satisfied with the purchase.',
      status: 'APPROVED',
      isVerified: true,
      helpfulCount: 15,
      createdAt: new Date('2024-11-23T10:15:00Z'),
    },
  });

  await prisma.review.create({
    data: {
      productId: products[4].id,
      userId: customer2.id,
      rating: 5,
      title: 'Perfect for design work',
      comment: '4K resolution is amazing! Colors are accurate right out of the box (99% sRGB as advertised). The USB-C connection is super convenient - charges my laptop while providing display and data. Great for photo editing and design work.',
      status: 'APPROVED',
      isVerified: false,
      helpfulCount: 8,
      createdAt: new Date('2024-11-18T14:20:00Z'),
    },
  });

  console.log('✅ Reviews created');

  // ============================================
  // LOYALTY TRANSACTIONS
  // ============================================
  console.log('Creating loyalty point transactions...');

  const customer1Loyalty = await prisma.loyaltyProfile.findUnique({
    where: { userId: customer1.id },
  });

  if (customer1Loyalty) {
    await prisma.loyaltyTransaction.createMany({
      data: [
        {
          profileId: customer1Loyalty.id,
          type: 'EARNED',
          points: 232,
          description: 'Points earned from order ORD-2024-00001',
          orderId: order1.id,
          createdAt: new Date('2024-11-20T14:30:00Z'),
        },
        {
          profileId: customer1Loyalty.id,
          type: 'EARNED',
          points: 500,
          description: 'Bonus points for reaching Gold tier',
          createdAt: new Date('2024-10-15T10:00:00Z'),
        },
        {
          profileId: customer1Loyalty.id,
          type: 'REDEEMED',
          points: -1000,
          description: 'Redeemed for $100 discount',
          createdAt: new Date('2024-09-20T13:45:00Z'),
        },
      ],
    });
  }

  console.log('✅ Loyalty transactions created');

  // ============================================
  // INVENTORY LOGS
  // ============================================
  console.log('Creating inventory logs...');

  await prisma.inventoryLog.createMany({
    data: [
      {
        productId: products[0].id,
        action: 'SALE',
        quantity: -1,
        previousQty: 51,
        newQty: 50,
        notes: 'Sold via order ORD-2024-00001',
        userId: warehouseManager.id,
        orderId: order1.id,
        createdAt: new Date('2024-11-16T09:00:00Z'),
      },
      {
        productId: products[0].id,
        action: 'SALE',
        quantity: -5,
        previousQty: 50,
        newQty: 45,
        notes: 'Sold via GSA order ORD-2024-00003',
        userId: warehouseManager.id,
        orderId: order3.id,
        createdAt: new Date('2024-11-11T13:00:00Z'),
      },
      {
        productId: products[0].id,
        action: 'SALE',
        quantity: -10,
        previousQty: 55,
        newQty: 45,
        notes: 'Bulk B2B sale via order ORD-2024-00002',
        userId: warehouseManager.id,
        orderId: order2.id,
        createdAt: new Date('2024-11-25T10:00:00Z'),
      },
    ],
  });

  console.log('✅ Inventory logs created');

  // ============================================
  // NOTIFICATIONS
  // ============================================
  console.log('Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        type: 'ORDER_UPDATE',
        title: 'Order Delivered',
        message: 'Your order ORD-2024-00001 has been delivered!',
        data: JSON.stringify({ orderId: order1.id, orderNumber: order1.orderNumber }),
        isRead: true,
        readAt: new Date('2024-11-20T15:00:00Z'),
        createdAt: new Date('2024-11-20T14:30:00Z'),
      },
      {
        userId: b2bCustomer.id,
        type: 'SHIPMENT_UPDATE',
        title: 'Order Shipped',
        message: 'Your order ORD-2024-00002 is on its way! Track it with UPS.',
        data: JSON.stringify({ orderId: order2.id, trackingNumber: '1Z999AA10123456784' }),
        isRead: false,
        createdAt: new Date('2024-11-25T10:00:00Z'),
      },
      {
        userId: customer1.id,
        type: 'LOYALTY_UPDATE',
        title: 'Points Earned!',
        message: 'You earned 232 loyalty points from your recent purchase.',
        data: JSON.stringify({ points: 232 }),
        isRead: true,
        readAt: new Date('2024-11-20T16:00:00Z'),
        createdAt: new Date('2024-11-20T14:30:00Z'),
      },
    ],
  });

  console.log('✅ Notifications created');

  // ============================================
  // SETTINGS
  // ============================================
  console.log('Creating system settings...');

  const settings = [
    { key: 'site_name', value: 'Enterprise E-commerce', category: 'general', isPublic: true },
    { key: 'site_email', value: 'support@ecommerce.com', category: 'general', isPublic: true },
    { key: 'currency', value: 'USD', category: 'general', isPublic: true },
    { key: 'currency_symbol', value: '$', category: 'general', isPublic: true },
    { key: 'tax_rate', value: '8.0', type: 'number', category: 'financial', isPublic: false },
    { key: 'free_shipping_threshold', value: '50', type: 'number', category: 'shipping', isPublic: true },
    { key: 'loyalty_points_ratio', value: '10', type: 'number', category: 'loyalty', isPublic: true },
    { key: 'enable_b2b', value: 'true', type: 'boolean', category: 'features', isPublic: false },
    { key: 'enable_gsa', value: 'true', type: 'boolean', category: 'features', isPublic: false },
    { key: 'enable_reviews', value: 'true', type: 'boolean', category: 'features', isPublic: false },
    { key: 'usps_enabled', value: 'true', type: 'boolean', category: 'shipping', isPublic: false },
    { key: 'fedex_enabled', value: 'true', type: 'boolean', category: 'shipping', isPublic: false },
    { key: 'ups_enabled', value: 'true', type: 'boolean', category: 'shipping', isPublic: false },
    { key: 'stripe_enabled', value: 'true', type: 'boolean', category: 'payment', isPublic: false },
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
  console.log('🎉 Comprehensive database seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - Users: 10 (all roles including B2B, GSA)');
  console.log('  - Products: 15 (with US pricing and specifications)');
  console.log('  - Categories: 4');
  console.log('  - Orders: 3 (B2C delivered, B2B in-transit, GSA delivered)');
  console.log('  - Shipments: 3 (FedEx, UPS, USPS with full tracking)');
  console.log('  - Invoices: 3 (with payment details)');
  console.log('  - Reviews: 3');
  console.log('  - Discounts: 4');
  console.log('  - Addresses: 5 (US format with valid ZIP codes)');
  console.log('');
  console.log('🔐 Test Accounts:');
  console.log('  Super Admin:      superadmin@ecommerce.com / password123');
  console.log('  Admin:            admin@ecommerce.com / password123');
  console.log('  Accountant:       accountant@ecommerce.com / password123');
  console.log('  Warehouse Mgr:    warehouse@ecommerce.com / password123');
  console.log('  Customer Service: support@ecommerce.com / password123');
  console.log('  Marketing Mgr:    marketing@ecommerce.com / password123');
  console.log('  Customer (B2C):   john.doe@gmail.com / password123');
  console.log('  Customer (B2C):   jane.smith@gmail.com / password123');
  console.log('  B2B Customer:     purchasing@techcorp.com / password123');
  console.log('  GSA Customer:     procurement@gsa.gov / password123');
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
