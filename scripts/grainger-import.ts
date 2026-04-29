/**
 * Grainger Import CLI Runner
 *
 * Runs the Grainger import in a standalone Node process so the Next.js
 * server stays responsive. Spawned by /api/admin/grainger-import as a
 * detached child.
 *
 * Usage:
 *   ts-node scripts/grainger-import.ts --file=<path> --job=<jobId> [--start=<row>]
 *   ts-node scripts/grainger-import.ts --file=<path> --dry-run
 *
 * Recommended on the server (lower priority so site stays smooth):
 *   nice -n 19 ionice -c 3 ts-node scripts/grainger-import.ts --file=... --job=...
 */

import { prisma } from '../src/lib/prisma';
import { runGraingerImport } from '../src/lib/services/grainger-import';
import { existsSync, unlinkSync } from 'fs';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const filePath = arg('file');
  const jobId = arg('job') || null;
  const startRow = parseInt(arg('start') || '0', 10) || 0;
  const dryRun = process.argv.includes('--dry-run');
  const cleanup = process.argv.includes('--cleanup');

  if (!filePath) {
    console.error('Usage: ts-node scripts/grainger-import.ts --file=<path> [--job=<jobId>] [--start=<row>] [--dry-run] [--cleanup]');
    process.exit(1);
  }
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`[grainger-cli] starting`);
  console.log(`  file:  ${filePath}`);
  console.log(`  job:   ${jobId || '(none)'}`);
  console.log(`  start: row ${startRow}`);
  console.log(`  mode:  ${dryRun ? 'DRY RUN' : 'WRITE'}`);

  if (jobId) {
    await prisma.bulkImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    }).catch((e) => console.error(`[grainger-cli] failed to mark job processing: ${e.message}`));
  }

  const startedAt = Date.now();
  let lastLog = startedAt;

  try {
    if (dryRun) {
      console.log('[grainger-cli] dry-run: parsing without writing…');
      const { streamGraingerRows } = await import('../src/lib/services/grainger-import');
      let count = 0;
      for await (const _row of streamGraingerRows(filePath)) {
        count++;
        if (count % 5000 === 0) console.log(`[grainger-cli] parsed ${count} rows`);
      }
      console.log(`[grainger-cli] DRY RUN complete: ${count} rows`);
      return;
    }

    const progress = await runGraingerImport(filePath, jobId, {
      startRow,
      onProgress: async (p) => {
        const now = Date.now();
        if (now - lastLog > 5000) {
          const elapsedMin = ((now - startedAt) / 1000 / 60).toFixed(1);
          const rate = p.processedRows / Math.max((now - startedAt) / 1000, 1);
          console.log(`[grainger-cli] ${p.processedRows} processed | ${p.successCount} ok | ${p.errorCount} err | ${p.skippedNoImage} no-img | ${rate.toFixed(1)} rows/s | ${elapsedMin} min`);
          lastLog = now;
        }
      },
    });

    if (jobId) {
      await prisma.bulkImportJob.update({
        where: { id: jobId },
        data: {
          status: progress.errorCount > 0 && progress.successCount === 0 ? 'FAILED' : 'COMPLETED',
          processedRows: progress.processedRows,
          successCount: progress.successCount,
          errorCount: progress.errorCount,
          totalRows: progress.totalRows,
          summary: {
            totalRows: progress.totalRows,
            successCount: progress.successCount,
            errorCount: progress.errorCount,
            skippedNoImage: progress.skippedNoImage,
            elapsedSec: Math.round((Date.now() - startedAt) / 1000),
          },
          completedAt: new Date(),
        },
      });
    }

    console.log(`\n[grainger-cli] DONE`);
    console.log(`  total:        ${progress.totalRows}`);
    console.log(`  succeeded:    ${progress.successCount}`);
    console.log(`  errors:       ${progress.errorCount}`);
    console.log(`  no-image:     ${progress.skippedNoImage}`);
    console.log(`  elapsed:      ${((Date.now() - startedAt) / 1000 / 60).toFixed(1)} min`);
  } catch (err: any) {
    console.error(`[grainger-cli] FATAL: ${err.message}`);
    console.error(err.stack);
    if (jobId) {
      await prisma.bulkImportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errors: [{ row: 0, field: 'fatal', message: err.message }],
          completedAt: new Date(),
        },
      }).catch(() => {});
    }
    process.exit(2);
  } finally {
    if (cleanup && filePath.startsWith('/tmp/')) {
      try { unlinkSync(filePath); } catch {}
    }
    await prisma.$disconnect();
  }
}

main();
