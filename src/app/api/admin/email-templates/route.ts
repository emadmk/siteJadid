export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/email-templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const template = await prisma.emailTemplate.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        availableVariables: data.availableVariables || [],
        fromName: data.fromName || 'Store Name',
        fromEmail: data.fromEmail,
        replyToEmail: data.replyToEmail,
        ccEmails: data.ccEmails || [],
        bccEmails: data.bccEmails || [],
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template', details: error.message },
      { status: 500 }
    );
  }
}
