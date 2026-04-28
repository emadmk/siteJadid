const XLSX = require('xlsx');

const wb = XLSX.readFile('GS Import - Milwaukee (Apr-26).xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const targetCats = ['CLOTHING', 'HANDPRO', 'PPE', 'HEAD-PRO', 'EYEPRO'];
const filtered = rows.filter(r => targetCats.includes(String(r['Product Category']).trim()));

console.log(`Total rows in target categories: ${filtered.length}`);
console.log('Categories:', [...new Set(filtered.map(r => r['Product Category']))].join(', '));

const groups = {};

for (const row of filtered) {
  const spn = String(row['Supplier Part Number'] || '').trim();
  const name = String(row['Product Short Description'] || '').trim();
  const cat = String(row['Product Category'] || '').trim();
  const cost = Number(row['Product Last Cost in Stock UOM'] || 0);
  const l1 = Number(row['Level 1 Price'] || 0);

  let baseName = name;
  const dashIdx = name.lastIndexOf(' - ');
  if (dashIdx > 20) {
    baseName = name.substring(0, dashIdx).trim();
  }

  baseName = baseName
    .replace(/\s+(XXL|XL|2XL|3XL|4XL|S\/M|L\/XL|S|M|L|One Size Fits All|OSFA)\s*$/i, '')
    .replace(/\s+(Small|Medium|Large|X-Large|XX-Large)\s*$/i, '')
    .replace(/\s+(Yellow|Orange|Red|Black|Gray|Grey|White|Blue|Green|Hi-Vis|Hi Vis|High Vis)\s*$/i, '')
    .trim();

  const key = `${cat}|||${baseName}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push({ spn, name, cat, cost, l1 });
}

const multiGroups = Object.entries(groups)
  .filter(([, items]) => items.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\nTotal base product groups: ${Object.keys(groups).length}`);
console.log(`Groups with multiple items (potential variants): ${multiGroups.length}`);
console.log(`Products that could be variants: ${multiGroups.reduce((s, [,v]) => s + v.length, 0)}`);

console.log('\n=== Top 25 Variant Groups ===\n');
for (const [key, items] of multiGroups.slice(0, 25)) {
  const [cat, baseName] = key.split('|||');
  console.log(`[${cat}] ${baseName} (${items.length} variants)`);
  for (const it of items.slice(0, 8)) {
    console.log(`  ${it.spn.padEnd(16)} $${it.l1.toFixed(2).padStart(8)} | ${it.name}`);
  }
  if (items.length > 8) console.log(`  ... and ${items.length - 8} more`);
  console.log();
}

// Summary stats
console.log('=== Summary ===');
console.log(`Single products (no grouping needed): ${Object.values(groups).filter(v => v.length === 1).length}`);
console.log(`Variant groups (2+ items): ${multiGroups.length}`);
console.log(`Total items in variant groups: ${multiGroups.reduce((s, [,v]) => s + v.length, 0)}`);
console.log(`Average variants per group: ${(multiGroups.reduce((s, [,v]) => s + v.length, 0) / multiGroups.length).toFixed(1)}`);
const sizeDist = {};
for (const [, items] of multiGroups) {
  const k = items.length >= 10 ? '10+' : String(items.length);
  sizeDist[k] = (sizeDist[k] || 0) + 1;
}
console.log('Group size distribution:', JSON.stringify(sizeDist));
