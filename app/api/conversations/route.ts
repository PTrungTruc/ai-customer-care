import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConversationStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      if (conversation.userId !== session.user.id && session.user.role === 'USER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(conversation);
    }

    const where = session.user.role === 'USER' ? ({ status: { in: Object.values(ConversationStatus).filter(s => s !== ('CLOSED')), userId: session.user.id }})
      : { status: { in: Object.values(ConversationStatus).filter(s => s !== ('CLOSED')), },
        OR: [
          { userId: session.user.id },
          { staffId: session.user.id },
          {
            staffId: null,
            status: { in: Object.values(ConversationStatus).filter(s => s.startsWith('HANDOVER')), }
          },
        ],
      };


    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}