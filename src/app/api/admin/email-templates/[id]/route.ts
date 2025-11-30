import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      description,
      subject,
      htmlContent,
      textContent,
      availableVariables,
      fromName,
      fromEmail,
      replyToEmail,
      isActive,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (textContent !== undefined) updateData.textContent = textContent;
    if (availableVariables !== undefined) updateData.availableVariables = availableVariables;
    if (fromName !== undefined) updateData.fromName = fromName;
    if (fromEmail !== undefined) updateData.fromEmail = fromEmail;
    if (replyToEmail !== undefined) updateData.replyToEmail = replyToEmail;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating email template:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.emailTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
