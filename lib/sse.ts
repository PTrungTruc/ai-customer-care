// SingleTon file for realtime reload chat

export type SSEPayload =
    | { type: 'connected' }
    | { type: 'new_message'; message: any };

export const clients = new Map<
    string,
    Set<ReadableStreamDefaultController>
>();

export function broadcast(conversationId: string, message: any) {
  const set = clients.get(conversationId);
  if (!set) return;

  const enc = new TextEncoder();

  for (const controller of Array.from(set)) {
    try {
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify(message)}\n\n`)
      );
    } catch {
      set.delete(controller);
    }
  }
}