import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}
