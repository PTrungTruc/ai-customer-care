// app/api/chat/stream/route.ts
import { clients } from '@/lib/sse';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId')!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let set = clients.get(conversationId);
      if (!set) {
        set = new Set();
        clients.set(conversationId, set);
      }
      set.add(controller);

      // 🟢 gửi ping để giữ connection
      controller.enqueue(
        encoder.encode(`event: ping\ndata: {}\n\n`)
      );

      req.signal.addEventListener('abort', () => {
        set!.delete(controller);
        if (set!.size === 0) clients.delete(conversationId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
