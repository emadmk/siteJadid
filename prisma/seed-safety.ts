const { PrismaClient, UserRole, AccountType, LoyaltyTier, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod, ShipmentStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🦺 Starting Safety Equipment Store Seed (US Standards)...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // USERS - All roles
  // ============================================
  console.log('Creating users...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@safetygear.com' },
    update: {},
    create: {
      email: 'admin@safetygear.com',
      password: hashedPassword,
      name: 'Michael Anderson',
      phone: '+14155551001',
      role: UserRole.SUPER_ADMIN,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'john.construction@gmail.com' },
    update: {},
    create: {
      email: 'john.construction@gmail.com',
      password: hashedPassword,
      name: 'John Martinez',
      phone: '+14155552001',
      role: UserRole.CUSTOMER,
      accountType: AccountType.B2C,
      emailVerified: new Date(),
    },
  });

  const b2bCustomer = await prisma.user.upsert({
    where: { email: 'safety@constructionco.com' },
    update: {},
    create: {
      email: 'safety@constructionco.com',
      password: hashedPassword,
      name: 'David Johnson',
      phone: '+14155553001',
      role: UserRole.B2B_CUSTOMER,
      accountType: AccountType.B2B,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Users created');

  // ============================================
  // ADDRESSES
  // ============================================
  console.log('Creating addresses...');

  const customer1Addr = await prisma.address.create({
    data: {
      userId: customer1.id,
      type: 'BOTH',
      firstName: 'John',
      lastName: 'Martinez',
      address1: '456 Construction Way',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA',
      phone: '+17135551234',
      isDefault: true,
    },
  });

  const b2bAddr = await prisma.address.create({
    data: {
      userId: b2bCustomer.id,
      type: 'BOTH',
      firstName: 'David',
      lastName: 'Johnson',
      company: 'ABC Construction Company',
      address1: '1000 Industrial Blvd',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      country: 'USA',
      phone: '+12145551000',
      isDefault: true,
    },
  });

  console.log('✅ Addresses created');

  // ============================================
  // LOYALTY & B2B PROFILES
  // ============================================
  await prisma.loyaltyProfile.upsert({
    where: { userId: customer1.id },
    update: {},
    create: {
      userId: customer1.id,
      tier: LoyaltyTier.GOLD,
      points: 1500,
      lifetimePoints: 3000,
      lifetimeSpent: 4500,
    },
  });

  await prisma.b2BProfile.upsert({
    where: { userId: b2bCustomer.id },
    update: {},
    create: {
      userId: b2bCustomer.id,
      companyName: 'ABC Construction Company',
      taxId: '12-3456789',
      businessLicense: 'TX-BL-2024-001234',
      creditLimit: 50000,
      creditUsed: 12000,
      paymentTerms: 30,
      discountPercent: 15,
      status: 'APPROVED',
      approvedAt: new Date('2024-01-15'),
      approvedBy: superAdmin.id,
    },
  });

  // ============================================
  // SAFETY EQUIPMENT CATEGORIES
  // ============================================
  console.log('Creating safety equipment categories...');

  const footwear = await prisma.category.create({
    data: {
      name: 'Safety Footwear',
      slug: 'safety-footwear',
      description: 'Steel toe boots, safety shoes, and protective footwear',
      isActive: true,
      order: 1,
    },
  });

  const headProtection = await prisma.category.create({
    data: {
      name: 'Head Protection',
      slug: 'head-protection',
      description: 'Hard hats, bump caps, and head protection equipment',
      isActive: true,
      order: 2,
    },
  });

  const hiVisClothing = await prisma.category.create({
    data: {
      name: 'Hi-Visibility Clothing',
      slug: 'hi-visibility-clothing',
      description: 'Safety vests, jackets, and high-visibility apparel',
      isActive: true,
      order: 3,
    },
  });

  const handProtection = await prisma.category.create({
    data: {
      name: 'Hand Protection',
      slug: 'hand-protection',
      description: 'Work gloves, cut-resistant gloves, and hand safety',
      isActive: true,
      order: 4,
    },
  });

  const eyeFaceProtection = await prisma.category.create({
    data: {
      name: 'Eye & Face Protection',
      slug: 'eye-face-protection',
      description: 'Safety glasses, goggles, and face shields',
      isActive: true,
      order: 5,
    },
  });

  const hearingProtection = await prisma.category.create({
    data: {
      name: 'Hearing Protection',
      slug: 'hearing-protection',
      description: 'Earplugs, earmuffs, and hearing safety equipment',
      isActive: true,
      order: 6,
    },
  });

  const respiratoryProtection = await prisma.category.create({
    data: {
      name: 'Respiratory Protection',
      slug: 'respiratory-protection',
      description: 'Masks, respirators, and breathing protection',
      isActive: true,
      order: 7,
    },
  });

  const fallProtection = await prisma.category.create({
    data: {
      name: 'Fall Protection',
      slug: 'fall-protection',
      description: 'Harnesses, lanyards, and fall arrest systems',
      isActive: true,
      order: 8,
    },
  });

  console.log('✅ Categories created');

  // ============================================
  // SAFETY EQUIPMENT PRODUCTS (20 Products)
  // ============================================
  console.log('Creating safety equipment products...');

  const products = await Promise.all([
    // SAFETY FOOTWEAR
    prisma.product.create({
      data: {
        sku: 'BOOT-ST-001',
        name: 'Timberland PRO Steel Toe Work Boots - 6 Inch',
        slug: 'timberland-pro-steel-toe-boots-6-inch',
        description: 'Premium leather work boots with steel toe protection. ASTM F2413-11 safety standards. Oil-resistant rubber outsole. Electrical hazard protection. Anti-fatigue technology footbed for all-day comfort. Waterproof construction.',
        shortDescription: 'Steel toe, waterproof, electrical hazard protection',
        status: ProductStatus.ACTIVE,
        basePrice: 139.99,
        salePrice: 119.99,
        cost: 75.00,
        wholesalePrice: 105.00,
        gsaPrice: 115.00,
        gsaSin: 'SIN-8415-01',
        stockQuantity: 150,
        categoryId: footwear.id,
        images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800'],
        weight: 4.5,
        dimensions: '{"length": 12, "width": 5, "height": 7}',
        isFeatured: true,
        isBestSeller: true,
        metaTitle: 'Timberland PRO Steel Toe Work Boots',
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'SHOE-CT-001',
        name: 'Skechers Work Composite Toe Safety Shoes',
        slug: 'skechers-work-composite-toe-shoes',
        description: 'Lightweight composite toe safety shoes. Non-metallic construction. Electrical hazard protection. Memory foam insole. Slip-resistant outsole. Breathable mesh upper. Perfect for warehouse and light industrial work.',
        shortDescription: 'Composite toe, slip-resistant, electrical hazard',
        status: ProductStatus.ACTIVE,
        basePrice: 89.99,
        cost: 45.00,
        wholesalePrice: 72.00,
        stockQuantity: 200,
        categoryId: footwear.id,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
        weight: 2.8,
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'BOOT-INS-001',
        name: 'Carhartt Insulated Steel Toe Winter Boots',
        slug: 'carhartt-insulated-steel-toe-winter-boots',
        description: '400g Thinsulate insulation for cold weather. Steel toe protection. Waterproof leather upper. Oil-resistant Rugged Flex outsole. Fast Dry lining wicks away sweat. Rated for -25°F. Ideal for outdoor construction work.',
        shortDescription: 'Insulated, waterproof, steel toe, -25°F rated',
        status: ProductStatus.ACTIVE,
        basePrice: 169.99,
        salePrice: 149.99,
        cost: 95.00,
        wholesalePrice: 135.00,
        gsaPrice: 145.00,
        stockQuantity: 80,
        categoryId: footwear.id,
        images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800'],
        weight: 5.2,
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // HEAD PROTECTION
    prisma.product.create({
      data: {
        sku: 'HARDHAT-3M-001',
        name: '3M Hard Hat with Ratchet Suspension - Type 1',
        slug: '3m-hard-hat-ratchet-suspension',
        description: 'ANSI Z89.1 Type 1 certified hard hat. High-density polyethylene shell. 4-point ratchet suspension for custom fit. Rain trough channels water away. UV resistant. Accessory slots for face shields and earmuffs. Multiple colors available.',
        shortDescription: 'ANSI certified, 4-point suspension, UV resistant',
        status: ProductStatus.ACTIVE,
        basePrice: 24.99,
        cost: 12.00,
        wholesalePrice: 19.00,
        gsaPrice: 21.00,
        gsaSin: 'SIN-8415-02',
        stockQuantity: 500,
        categoryId: headProtection.id,
        images: ['https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'],
        weight: 0.95,
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'HARDHAT-MSA-001',
        name: 'MSA V-Gard Full Brim Hard Hat with Fas-Trac',
        slug: 'msa-v-gard-full-brim-hard-hat',
        description: 'Full brim design for sun and rain protection. Fas-Trac III suspension with 1-touch adjustment. Heat resistant up to 380°F. Slotted accessory channels. Meets ANSI Z89.1 standards. Made in USA.',
        shortDescription: 'Full brim, heat resistant, Fas-Trac suspension',
        status: ProductStatus.ACTIVE,
        basePrice: 34.99,
        cost: 18.00,
        wholesalePrice: 28.00,
        stockQuantity: 300,
        categoryId: headProtection.id,
        images: ['https://via.placeholder.com/800x600/2ECC71/FFFFFF?text=MSA+Hard+Hat'],
        weight: 1.1,
        publishedAt: new Date(),
      },
    }),

    // HI-VISIBILITY CLOTHING
    prisma.product.create({
      data: {
        sku: 'VEST-3M-001',
        name: '3M Class 2 Safety Vest - High Visibility',
        slug: '3m-class-2-safety-vest-high-visibility',
        description: 'ANSI/ISEA 107-2015 Class 2 certified. 3M Scotchlite reflective material. Breathable mesh fabric. Hook and loop closure. Multiple pockets. Bright lime yellow color. Machine washable. One size fits most.',
        shortDescription: 'Class 2, 3M Scotchlite, breathable mesh',
        status: ProductStatus.ACTIVE,
        basePrice: 12.99,
        cost: 6.00,
        wholesalePrice: 9.50,
        gsaPrice: 10.50,
        gsaSin: 'SIN-8415-03',
        stockQuantity: 1000,
        categoryId: hiVisClothing.id,
        images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
        weight: 0.4,
        isFeatured: true,
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'JACKET-PORT-001',
        name: 'PortWest Class 3 Bomber Jacket - Waterproof',
        slug: 'portwest-class-3-bomber-jacket-waterproof',
        description: 'ANSI Class 3 high-visibility bomber jacket. Waterproof and breathable fabric. Quilted lining for warmth. 2-inch reflective tape. Multiple pockets including radio pocket. Concealed hood in collar. Available in sizes S-4XL.',
        shortDescription: 'Class 3, waterproof, quilted, reflective',
        status: ProductStatus.ACTIVE,
        basePrice: 49.99,
        salePrice: 44.99,
        cost: 28.00,
        wholesalePrice: 38.00,
        stockQuantity: 250,
        categoryId: hiVisClothing.id,
        images: ['https://via.placeholder.com/800x600/FFD700/000000?text=Hi-Vis+Jacket'],
        weight: 2.1,
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // HAND PROTECTION
    prisma.product.create({
      data: {
        sku: 'GLOVE-MECHanix-001',
        name: 'Mechanix Wear Original Work Gloves',
        slug: 'mechanix-wear-original-work-gloves',
        description: 'Form-fitting TrekDry material keeps hands cool and comfortable. Durable synthetic leather palm. Reinforced thumb and index finger. Machine washable. Touchscreen compatible. Available in sizes S-XXL. Multiple colors.',
        shortDescription: 'Durable, breathable, touchscreen compatible',
        status: ProductStatus.ACTIVE,
        basePrice: 19.99,
        cost: 10.00,
        wholesalePrice: 15.00,
        stockQuantity: 800,
        categoryId: handProtection.id,
        images: ['https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=800'],
        weight: 0.3,
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'GLOVE-CUT-001',
        name: 'HexArmor Cut Resistant Gloves - Level A4',
        slug: 'hexarmor-cut-resistant-gloves-level-a4',
        description: 'ANSI A4 cut protection. SuperFabric brand material. Superior grip in wet and dry conditions. Impact protection on back of hand. Touchscreen compatible. Machine washable. Ideal for glass handling and metal fabrication.',
        shortDescription: 'Cut Level A4, impact protection, SuperFabric',
        status: ProductStatus.ACTIVE,
        basePrice: 39.99,
        cost: 22.00,
        wholesalePrice: 32.00,
        gsaPrice: 35.00,
        stockQuantity: 400,
        categoryId: handProtection.id,
        images: ['https://via.placeholder.com/800x600/000000/FFD700?text=Cut+Resistant+Gloves'],
        weight: 0.4,
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    // EYE & FACE PROTECTION
    prisma.product.create({
      data: {
        sku: 'GLASS-3M-001',
        name: '3M SecureFit Safety Glasses - Anti-Fog',
        slug: '3m-securefit-safety-glasses-anti-fog',
        description: 'ANSI Z87.1 certified. Pressure diffusion temple technology. Anti-fog and anti-scratch coating. 99.9% UVA/UVB protection. Wraparound design. Clear and tinted lenses available. Lightweight and comfortable for all-day wear.',
        shortDescription: 'ANSI Z87.1, anti-fog, UV protection, SecureFit',
        status: ProductStatus.ACTIVE,
        basePrice: 8.99,
        cost: 4.00,
        wholesalePrice: 6.50,
        gsaPrice: 7.50,
        gsaSin: 'SIN-8415-04',
        stockQuantity: 1500,
        categoryId: eyeFaceProtection.id,
        images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=800'],
        weight: 0.15,
        isBestSeller: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'GOGGLE-UVX-001',
        name: 'Uvex Stealth Safety Goggles - Chemical Splash',
        slug: 'uvex-stealth-safety-goggles-chemical-splash',
        description: 'Chemical splash and impact protection. Uvex XTR Plus anti-fog coating. Indirect venting system. Fits over prescription glasses. Neoprene headband. D3, D4, and D5 rated. Autoclavable up to 250°F.',
        shortDescription: 'Chemical splash, anti-fog, over glasses fit',
        status: ProductStatus.ACTIVE,
        basePrice: 24.99,
        cost: 13.00,
        wholesalePrice: 19.00,
        stockQuantity: 600,
        categoryId: eyeFaceProtection.id,
        images: ['https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Safety+Goggles'],
        weight: 0.35,
        publishedAt: new Date(),
      },
    }),

    // HEARING PROTECTION
    prisma.product.create({
      data: {
        sku: 'EAR-3M-001',
        name: '3M E-A-R Classic Earplugs - 200 Pairs',
        slug: '3m-ear-classic-earplugs-200-pairs',
        description: 'NRR 29dB noise reduction rating. Slow recovery foam for comfortable fit. Moisture resistant. Flame resistant. Individually wrapped pairs. Ideal for construction, manufacturing, and shooting ranges. Tested to ANSI S3.19.',
        shortDescription: 'NRR 29dB, foam, 200 pairs, individually wrapped',
        status: ProductStatus.ACTIVE,
        basePrice: 34.99,
        cost: 18.00,
        wholesalePrice: 27.00,
        gsaPrice: 30.00,
        stockQuantity: 500,
        categoryId: hearingProtection.id,
        images: ['https://via.placeholder.com/800x600/FFB6C1/000000?text=Ear+Plugs'],
        weight: 0.8,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'EARMUFF-HOW-001',
        name: 'Howard Leight Impact Sport Electronic Earmuffs',
        slug: 'howard-leight-impact-sport-earmuffs',
        description: 'NRR 22dB electronic noise protection. Built-in directional microphones amplify ambient sounds. Automatic shut-off after 4 hours. Folds for compact storage. AUX input for MP3 players. Runs on 2 AAA batteries.',
        shortDescription: 'Electronic, NRR 22dB, microphones, foldable',
        status: ProductStatus.ACTIVE,
        basePrice: 59.99,
        salePrice: 54.99,
        cost: 32.00,
        wholesalePrice: 47.00,
        stockQuantity: 200,
        categoryId: hearingProtection.id,
        images: ['https://via.placeholder.com/800x600/2ECC71/FFFFFF?text=Electronic+Earmuffs'],
        weight: 0.75,
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),

    // RESPIRATORY PROTECTION
    prisma.product.create({
      data: {
        sku: 'MASK-3M-001',
        name: '3M N95 Respirator Mask 8210 - Box of 20',
        slug: '3m-n95-respirator-mask-8210-box-20',
        description: 'NIOSH approved N95 filtration. Filters at least 95% of airborne particles. Adjustable nose clip. Braided headbands. Lightweight construction. Ideal for construction, woodworking, and general maintenance. Not for oil-based particles.',
        shortDescription: 'N95, NIOSH approved, adjustable, 20-pack',
        status: ProductStatus.ACTIVE,
        basePrice: 29.99,
        cost: 15.00,
        wholesalePrice: 23.00,
        gsaPrice: 25.00,
        gsaSin: 'SIN-8415-05',
        stockQuantity: 800,
        categoryId: respiratoryProtection.id,
        images: ['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800'],
        weight: 0.3,
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'RESP-3M-001',
        name: '3M Half Facepiece Reusable Respirator 6200',
        slug: '3m-half-facepiece-reusable-respirator-6200',
        description: 'Medium size half facepiece. Uses bayonet-style cartridge connection. Soft thermoplastic elastomer facepiece. Speaking diaphragm for easier communication. Compatible with 3M 2000 series filters. NIOSH approved when used with 3M cartridges.',
        shortDescription: 'Reusable, bayonet filters, soft facepiece',
        status: ProductStatus.ACTIVE,
        basePrice: 44.99,
        cost: 24.00,
        wholesalePrice: 36.00,
        stockQuantity: 300,
        categoryId: respiratoryProtection.id,
        images: ['https://via.placeholder.com/800x600/666666/FFFFFF?text=Half+Mask+Respirator'],
        weight: 0.55,
        publishedAt: new Date(),
      },
    }),

    // FALL PROTECTION
    prisma.product.create({
      data: {
        sku: 'HARNESS-MILL-001',
        name: 'Miller Revolution Full Body Safety Harness',
        slug: 'miller-revolution-full-body-harness',
        description: 'ANSI Z359.11 certified. DualTech webbing is tear and abrasion resistant. Quick-Connect buckles for easy donning. Five adjustment points. D-ring indicator shows last inspection date. Capacity: 310 lbs. Available in universal and XL sizes.',
        shortDescription: 'Full body, ANSI certified, DualTech webbing',
        status: ProductStatus.ACTIVE,
        basePrice: 149.99,
        cost: 85.00,
        wholesalePrice: 120.00,
        gsaPrice: 130.00,
        gsaSin: 'SIN-8415-06',
        stockQuantity: 150,
        categoryId: fallProtection.id,
        images: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800'],
        weight: 3.2,
        isFeatured: true,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'LANYARD-FROGS-001',
        name: 'FallTech SRD Steel Snap Hook Shock Lanyard - 6ft',
        slug: 'falltech-srd-shock-lanyard-6ft',
        description: '6-foot single leg shock-absorbing lanyard. Integrated shock absorber limits fall arrest forces. Locking steel snap hooks at both ends. Wear indicators show when to retire. Meets ANSI and OSHA standards. 310 lb capacity.',
        shortDescription: '6ft, shock-absorbing, steel hooks, 310lb capacity',
        status: ProductStatus.ACTIVE,
        basePrice: 79.99,
        cost: 42.00,
        wholesalePrice: 64.00,
        stockQuantity: 200,
        categoryId: fallProtection.id,
        images: ['https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Safety+Lanyard'],
        weight: 2.5,
        publishedAt: new Date(),
      },
    }),

    // ADDITIONAL SAFETY ITEMS
    prisma.product.create({
      data: {
        sku: 'FIRSTAID-001',
        name: 'First Aid Only 90-Piece First Aid Kit - ANSI',
        slug: 'first-aid-only-90-piece-kit-ansi',
        description: 'ANSI Z308.1-2015 compliant. Metal case with wall mountable design. Contains bandages, gauze, tape, antiseptic wipes, burn cream, scissors, tweezers, and emergency blanket. Refill pouches available. Ideal for jobsites up to 25 people.',
        shortDescription: 'ANSI compliant, 90 pieces, wall mountable',
        status: ProductStatus.ACTIVE,
        basePrice: 24.99,
        cost: 13.00,
        wholesalePrice: 19.00,
        gsaPrice: 21.00,
        stockQuantity: 400,
        categoryId: hiVisClothing.id,
        images: ['https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800'],
        weight: 1.8,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'KNEEPAD-001',
        name: 'ProKnee Professional Knee Pads',
        slug: 'proknee-professional-knee-pads',
        description: 'Professional-grade knee pads with replaceable foam inserts. Adjustable straps with quick-release buckles. Durable Cordura outer shell. Layered gel and foam cushioning. Non-slip surface. Ideal for construction, flooring, and plumbing work.',
        shortDescription: 'Professional, replaceable foam, quick-release',
        status: ProductStatus.ACTIVE,
        basePrice: 69.99,
        cost: 38.00,
        wholesalePrice: 56.00,
        stockQuantity: 250,
        categoryId: handProtection.id,
        images: ['https://via.placeholder.com/800x600/000080/FFFFFF?text=Knee+Pads'],
        weight: 1.4,
        publishedAt: new Date(),
      },
    }),

    prisma.product.create({
      data: {
        sku: 'COOLER-ERG-001',
        name: 'Ergodyne Chill-Its Cooling Vest',
        slug: 'ergodyne-chill-its-cooling-vest',
        description: 'Evaporative cooling technology. Soak in water for 2-5 minutes to activate. Provides cooling relief for 2-4 hours. Lightweight and breathable. Helps prevent heat stress. Machine washable. Available in sizes M-3XL.',
        shortDescription: 'Evaporative cooling, 2-4 hours relief, washable',
        status: ProductStatus.ACTIVE,
        basePrice: 44.99,
        cost: 24.00,
        wholesalePrice: 36.00,
        stockQuantity: 180,
        categoryId: hiVisClothing.id,
        images: ['https://via.placeholder.com/800x600/87CEEB/000000?text=Cooling+Vest'],
        weight: 0.9,
        isNewArrival: true,
        publishedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${products.length} Safety equipment products created`);

  // ============================================
  // DISCOUNTS
  // ============================================
  console.log('Creating discount codes...');

  await prisma.discount.create({
    data: {
      code: 'SAFETY15',
      name: '15% Off Safety Equipment',
      description: 'Get 15% off your first safety equipment order',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 15,
      minPurchase: 100,
      usageLimit: 5000,
      perUserLimit: 1,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      accountTypes: [AccountType.B2C],
    },
  });

  await prisma.discount.create({
    data: {
      code: 'BULK20',
      name: 'Bulk Order Discount',
      description: '20% off for bulk construction orders',
      type: 'PERCENTAGE',
      scope: 'GLOBAL',
      value: 20,
      minPurchase: 500,
      startsAt: new Date(),
      isActive: true,
      accountTypes: [AccountType.B2B],
    },
  });

  console.log('✅ Discounts created');

  // ============================================
  // SAMPLE ORDER
  // ============================================
  console.log('Creating sample order...');

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-00001',
      userId: customer1.id,
      accountType: AccountType.B2C,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 272.96,
      tax: 21.84,
      shipping: 12.99,
      discount: 40.94,
      total: 266.85,
      paymentMethod: PaymentMethod.STRIPE,
      paymentIntentId: 'pi_3SafetyGear123456',
      paidAt: new Date('2024-11-20T10:30:00Z'),
      billingAddressId: customer1Addr.id,
      shippingAddressId: customer1Addr.id,
      shippingCarrier: 'UPS',
      shippingMethod: 'UPS_GROUND',
      trackingNumber: '1Z999AA10987654321',
      shippedAt: new Date('2024-11-21T09:00:00Z'),
      deliveredAt: new Date('2024-11-25T14:30:00Z'),
      loyaltyPointsEarned: 27,
      createdAt: new Date('2024-11-20T10:25:00Z'),
      items: {
        create: [
          {
            productId: products[0].id,
            sku: products[0].sku,
            name: products[0].name,
            quantity: 1,
            price: 119.99,
            discount: 18.00,
            tax: 8.16,
            total: 110.15,
          },
          {
            productId: products[5].id,
            sku: products[5].sku,
            name: products[5].name,
            quantity: 2,
            price: 12.99,
            discount: 3.90,
            tax: 1.77,
            total: 23.85,
          },
          {
            productId: products[3].id,
            sku: products[3].sku,
            name: products[3].name,
            quantity: 3,
            price: 24.99,
            discount: 11.25,
            tax: 5.56,
            total: 63.16,
          },
          {
            productId: products[7].id,
            sku: products[7].sku,
            name: products[7].name,
            quantity: 2,
            price: 19.99,
            discount: 6.00,
            tax: 2.64,
            total: 36.62,
          },
        ],
      },
    },
  });

  console.log('✅ Sample order created');

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
      title: 'Best work boots I have ever owned!',
      comment: 'These Timberland PRO boots are absolutely worth every penny. The steel toe protection gives me confidence on the job site, and they are surprisingly comfortable even after 10-hour days. The waterproofing really works - my feet stayed dry during a rainstorm. Highly recommend for anyone in construction!',
      status: 'APPROVED',
      helpfulCount: 18,
      createdAt: new Date('2024-11-26T15:30:00Z'),
    },
  });

  await prisma.review.create({
    data: {
      productId: products[5].id,
      userId: customer1.id,
      orderId: order1.id,
      rating: 5,
      title: 'Great visibility, comfortable to wear',
      comment: 'The 3M safety vest is perfect for my road work job. The reflective stripes are very bright and visible from far away. The mesh material is breathable and does not make me overheat. Good value for the price.',
      status: 'APPROVED',
      helpfulCount: 12,
      createdAt: new Date('2024-11-27T10:15:00Z'),
    },
  });

  console.log('✅ Reviews created');

  // ============================================
  // SETTINGS
  // ============================================
  console.log('Creating system settings...');

  const settings = [
    { key: 'site_name', value: 'Safety Equipment Store', category: 'general', isPublic: true },
    { key: 'site_email', value: 'support@safetygearusa.com', category: 'general', isPublic: true },
    { key: 'currency', value: 'USD', category: 'general', isPublic: true },
    { key: 'currency_symbol', value: '$', category: 'general', isPublic: true },
    { key: 'tax_rate', value: '8.25', type: 'number', category: 'financial', isPublic: false },
    { key: 'free_shipping_threshold', value: '75', type: 'number', category: 'shipping', isPublic: true },
    { key: 'enable_b2b', value: 'true', type: 'boolean', category: 'features', isPublic: false },
    { key: 'enable_reviews', value: 'true', type: 'boolean', category: 'features', isPublic: false },
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
  console.log('🎉 Safety Equipment Store seed completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - Products: ${products.length} safety equipment items`);
  console.log('  - Categories: 8 (Footwear, Head, Hi-Vis, Hand, Eye, Hearing, Respiratory, Fall)');
  console.log('  - Orders: 1 complete order with delivery');
  console.log('  - Reviews: 2 verified reviews');
  console.log('  - Discounts: 2 promotional codes');
  console.log('');
  console.log('🔐 Test Accounts:');
  console.log('  Admin: admin@safetygear.com / password123');
  console.log('  Customer: john.construction@gmail.com / password123');
  console.log('  B2B: safety@constructionco.com / password123');
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
