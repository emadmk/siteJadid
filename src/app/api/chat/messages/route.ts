import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/chat/messages
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();

    if (!data.conversationId || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify access to conversation
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: session?.user?.id,
        senderType: session ? (
          ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'].includes(session.user.role)
            ? 'ADMIN'
            : 'USER'
        ) : 'USER',
        message: data.message,
        attachments: data.attachments || [],
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}
