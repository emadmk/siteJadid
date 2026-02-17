import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chat/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { assignedTo: session.user.id },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();

    // If not authenticated, require guest info
    if (!session?.user?.id) {
      if (!data.guestEmail || !data.guestName) {
        return NextResponse.json(
          { error: 'Guest name and email are required for unauthenticated users' },
          { status: 400 }
        );
      }
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        userId: session?.user?.id,
        guestName: session ? undefined : data.guestName,
        guestEmail: session ? undefined : data.guestEmail,
        subject: data.subject,
        department: data.department || 'Support',
        priority: data.priority || 'NORMAL',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        pageUrl: data.pageUrl,
      },
      include: {
        messages: true,
      },
    });

    // Create initial message if provided
    if (data.message) {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: session?.user?.id,
          senderType: session ? 'USER' : 'USER',
          message: data.message,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
