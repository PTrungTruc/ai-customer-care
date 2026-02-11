import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma'; // Giả sử bạn đã cấu hình prisma client

// Cập nhật trạng thái của hội thoại
export async function PATCH(req: Request, { params }: { params: { id: string, staffId : string } }) {
  const { id } = params;
  let { status, staffId } = await req.json(); // Status truyền lên trong body request

  if (!status) {
    return NextResponse.json({ message: 'Missing status' }, { status: 400 });
  }
  staffId = staffId == ""? null : staffId; 

  try {
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { status, staffId }, // Cập nhật trạng thái
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: id },
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
  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json({ message: 'Failed to update conversation status' }, { status: 500 });
  }
}
