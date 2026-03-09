// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Giả sử bạn đã cấu hình prisma client trong lib/prisma.ts
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

// // Lấy danh sách hội thoại
// export async function GET() {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const conversations = await prisma.conversation.findMany({
//       include: {
//         user: {
//           select: {
//             name: true,
//             email: true,
//           },
//         },
//         messages: {
//           orderBy: {
//             createdAt: 'asc',
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc', // Sắp xếp theo thời gian tạo
//       },
//     });    
//     return NextResponse.json(conversations);

//     // return NextResponse.json(conversations.filter(c => c.userId == session?.user?.id));
//   } catch (error) {
//     console.error('Error fetching conversations:', error);
//     return NextResponse.json({ message: 'Failed to load conversations' }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const skip = (page - 1) * limit;

    // tổng số conversation
    const total = await prisma.conversation.count();

    const conversations = await prisma.conversation.findMany({
      skip,
      take: limit,

      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: conversations,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    return NextResponse.json(
      { message: "Failed to load conversations" },
      { status: 500 }
    );
  }
}