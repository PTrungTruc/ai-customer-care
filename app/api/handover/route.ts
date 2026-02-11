import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, reason, action } = await req.json();
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (action === 'request') {
      if (conversation.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'HANDOVER_REQUESTED',
          handoverReason: reason || 'User requested assistance',
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversationId,
          role: 'assistant',
          content: '🔔 Yêu cầu hỗ trợ đã được gửi. Nhân viên sẽ tham gia sớm nhất có thể.',
        },
      });

      return NextResponse.json({ success: true, conversation: updated });
    }

    if (action === 'accept') {
      if (!['STAFF', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'HANDOVER_ACCEPTED',
          staffId: session.user.id,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversationId,
          userId: session.user.id,
          role: 'staff',
          content: `👋 Xin chào! Tôi là ${session.user.name}. Tôi sẽ hỗ trợ bạn.`,
        },
      });

      return NextResponse.json({ success: true, conversation: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Handover API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}