import { useEffect } from 'react';

export function useChatRealtime(
  conversationId: string | null,
  setMessages: React.Dispatch<any>
) {
  useEffect(() => {
    if (!conversationId) return;

    const es = new EventSource(
      `/api/chat/stream?conversationId=${conversationId}`
    );

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);

      console.log("Đây 3")

      if (payload.type === 'new_message') {
        setMessages((prev: any[]) => {
          const exists = prev.some(
            (m) => m.id === payload.message.id
          );
          if (exists) return prev;

          return [...prev, payload.message];
        });
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [conversationId, setMessages]);
}
