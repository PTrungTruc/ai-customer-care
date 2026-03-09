'use client';

import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface HeaderProps {
  title: string;
  description?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function EmbedHeader({ title, description }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');

  const isChatPage = title === 'Chat';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!isChatPage) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        const data = await res.json();
        // đảm bảo luôn là array
        if (Array.isArray(data)) {
          setConversations(data);
        } else if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else if (Array.isArray(data.data)) {
          setConversations(data.data);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversations();
  }, [isChatPage]);

  useEffect(() => {
    setSelectedId(conversationId ?? '');
  }, [conversationId]);

  const handleChange = (value: string) => {
    if (!value) {
      router.push('/embed_chat');
    } else {
      router.push(`/embed_chat?id=${value}`);
    }
  };

  const shorten = (text = "", max = 40) => text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isChatPage && (
            <select
              value={selectedId}
              onChange={(e) => handleChange(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm max-w-[260px] truncate"
            >
              <option value="">Hộp thoại mới</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id} title={`${c.title || "Chưa có title"} — ${new Date(c.updatedAt).toLocaleString("vi-VN")}`}>
                  {shorten((c.title || "Chưa có title") + " — " + new Date(c.updatedAt).toLocaleString("vi-VN"))}
                   {/* —{" "} {new Date(c.updatedAt).toLocaleString("vi-VN")} */}
                </option>
              ))}
            </select>
          )}

          <Badge
            variant={
              session?.user?.role === 'ADMIN'
                ? 'default'
                : 'secondary'
            }
          >
            {session?.user?.role}
          </Badge>
        </div>
      </div>
    </div>
  );
}