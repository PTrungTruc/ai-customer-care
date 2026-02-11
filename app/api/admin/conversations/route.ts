import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Giả sử bạn đã cấu hình prisma client trong lib/prisma.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Lấy danh sách hội thoại
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Sắp xếp theo thời gian tạo
      },
    });
    return NextResponse.json(conversations.filter(c => c.userId == session?.user?.id));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ message: 'Failed to load conversations' }, { status: 500 });
  }
}