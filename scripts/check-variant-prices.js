/**
 * Check variant prices in database
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking variant prices...\n');

  // Read Excel file to get expected prices
  const filePath = path.join(process.cwd(), 'public/uploads/Pricing-22 Percent MG-PIP- 27 Dec 25.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Get a few sample SKUs from Excel (variants)
  const sampleSkus = [];
  for (let i = 1; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (row && row[0]?.toString().toLowerCase() === 'variant') {
      sampleSkus.push({
        sku: row[2]?.toString().trim(),
        expectedPrice: parseFloat(row[14]) || 0, // Base Price column
      });
    }
  }

  console.log('Sample SKUs from Excel:');
  sampleSkus.forEach(s => console.log(`  ${s.sku}: Expected $${s.expectedPrice}`));

  console.log('\n--- Checking in Database ---\n');

  // Check these in database
  for (const sample of sampleSkus.slice(0, 10)) {
    // Try exact match
    let variant = await prisma.productVariant.findUnique({
      where: { sku: sample.sku },
      select: { sku: true, basePrice: true, name: true },
    });

    if (variant) {
      const match = Number(variant.basePrice) === sample.expectedPrice ? '✓' : '✗';
      console.log(`${match} ${sample.sku}: DB=$${Number(variant.basePrice).toFixed(2)}, Excel=$${sample.expectedPrice.toFixed(2)}`);
    } else {
      // Try finding similar
      const similar = await prisma.productVariant.findFirst({
        where: {
          sku: { contains: sample.sku.split('/')[0] }
        },
        select: { sku: true, basePrice: true },
      });

      if (similar) {
        console.log(`✗ ${sample.sku}: NOT FOUND (similar: ${similar.sku})`);
      } else {
        console.log(`✗ ${sample.sku}: NOT FOUND in database`);
      }
    }
  }

  // Count how many variants exist
  const totalVariants = await prisma.productVariant.count();
  console.log(`\nTotal variants in DB: ${totalVariants}`);

  // Check some random variants from DB
  console.log('\n--- Sample variants from DB ---');
  const dbVariants = await prisma.productVariant.findMany({
    take: 10,
    select: { sku: true, basePrice: true },
    orderBy: { updatedAt: 'desc' },
  });

  dbVariants.forEach(v => {
    console.log(`  ${v.sku}: $${Number(v.basePrice).toFixed(2)}`);
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
