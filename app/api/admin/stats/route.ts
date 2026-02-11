import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// export async function GET() {
//   return NextResponse.json({
//     totalConversations: 120,
//     activeConversations: 8,
//     totalHandovers: 15,
//     avgResponseTime: 12,

//     topQuestions: [
//       { question: 'Giá sản phẩm bao nhiêu?', count: 34 },
//       { question: 'Chính sách bảo hành?', count: 21 },
//       { question: 'Thời gian giao hàng?', count: 18 },
//       { question: 'Có đổi trả không?', count: 12 },
//       { question: 'Thanh toán thế nào?', count: 9 },
//     ],

//     conversationsByDay: [
//       { date: '2026-02-03', count: 12 },
//       { date: '2026-02-04', count: 18 },
//       { date: '2026-02-05', count: 20 },
//       { date: '2026-02-06', count: 25 },
//       { date: '2026-02-07', count: 30 },
//       { date: '2026-02-08', count: 10 },
//       { date: '2026-02-09', count: 5 },
//     ],
//   });
// }

export async function GET() {
  try {
    /* ======================
       BASIC COUNTS
    ====================== */

    const totalConversations = await prisma.conversation.count();

    const activeConversations = await prisma.conversation.count({
      where: { status: 'ACTIVE' },
    });

    const totalHandovers = await prisma.conversation.count({
      where: {
        status: {
          in: ['HANDOVER_REQUESTED', 'HANDOVER_ACCEPTED'],
        },
      },
    });

    /* ======================
       AVG RESPONSE TIME
    ====================== */

    // Lấy message user + assistant + staff
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            createdAt: true,
          },
        },
      },
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    for (const conv of conversations) {
      const msgs = conv.messages;
      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].role === 'user') {
          const next = msgs.slice(i + 1).find(m => m.role === 'assistant' || m.role === 'staff');
          if (next) {
            const diff =
              (next.createdAt.getTime() - msgs[i].createdAt.getTime()) / 1000;
            totalResponseTime += diff;
            responseCount++;
            break;
          }
        }
      }
    }

    const avgResponseTime =
      responseCount === 0 ? 0 : Math.round(totalResponseTime / responseCount);

    /* ======================
       TOP QUESTIONS
    ====================== */

    const topQuestionsRaw = await prisma.message.groupBy({
      by: ['content'],
      where: { role: 'user' },
      _count: { content: true },
      orderBy: {
        _count: { content: 'desc' },
      },
      take: 5,
    });

    const topQuestions = topQuestionsRaw.map(q => ({
      question: q.content.length > 100
        ? q.content.slice(0, 100) + '…'
        : q.content,
      count: q._count.content,
    }));

    /* ======================
       CONVERSATIONS BY DAY (7 DAYS)
    ====================== */

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);

    const conversationsByDayRaw = await prisma.$queryRaw<
      { date: string; count: bigint }[]
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM conversations
      WHERE "createdAt" >= ${fromDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const conversationsByDay = conversationsByDayRaw.map(d => ({
      date: d.date,
      count: Number(d.count),
    }));

    /* ======================
       RESPONSE
    ====================== */

    return NextResponse.json({
      totalConversations,
      activeConversations,
      totalHandovers,
      avgResponseTime,
      topQuestions,
      conversationsByDay,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}