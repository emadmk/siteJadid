import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TMP_DIR = '/tmp/grainger-imports';
const PROJECT_ROOT = process.cwd();
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'grainger-import.ts');

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return { error: 'Admin access required', status: 403 };
  }
  return { userId: user.id };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 });
    }

    if (!existsSync(TMP_DIR)) await mkdir(TMP_DIR, { recursive: true });

    const job = await prisma.bulkImportJob.create({
      data: {
        type: 'PRODUCTS',
        status: 'PENDING',
        fileName: file.name,
        fileSize: file.size,
        userId: auth.userId,
        fieldMapping: { importSource: 'grainger' },
        options: {},
      },
    });

    const savedPath = path.join(TMP_DIR, `${job.id}.xlsx`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(savedPath, buf);

    // Spawn detached background process. nice/ionice keeps it from hogging the box.
    // Using ts-node via npx to avoid PATH issues. cleanup flag deletes tmp file when done.
    const cmd = 'sh';
    const args = [
      '-c',
      `nice -n 19 ionice -c 3 npx ts-node --compiler-options '{"module":"CommonJS"}' "${SCRIPT_PATH}" --file="${savedPath}" --job=${job.id} --cleanup >> /tmp/grainger-import-${job.id}.log 2>&1`,
    ];
    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Background import started for ${file.name}. Track progress via GET ?jobId=${job.id}`,
      logPath: `/tmp/grainger-import-${job.id}.log`,
    });
  } catch (e: any) {
    console.error('grainger-import POST error', e);
    return NextResponse.json({ error: 'Failed to start import', details: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = await prisma.bulkImportJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      return NextResponse.json({ job });
    }

    const jobs = await prisma.bulkImportJob.findMany({
      where: {
        userId: auth.userId,
        type: 'PRODUCTS',
        fieldMapping: { path: ['importSource'], equals: 'grainger' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ jobs });
  } catch (e: any) {
    console.error('grainger-import GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
