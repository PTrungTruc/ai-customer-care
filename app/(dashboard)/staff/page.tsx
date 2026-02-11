'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/types';
import { MessageSquare, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.filter((c: Conversation) => 
          c.status === 'HANDOVER_REQUESTED' || c.status === 'HANDOVER_ACCEPTED'
        ));
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHandover = async (conversationId: string) => {
    try {
      const response = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'accept',
        }),
      });

      if (response.ok) {
        loadConversations();
      }
    } catch (error) {
      console.error('Accept handover error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      HANDOVER_REQUESTED: 'destructive',
      HANDOVER_ACCEPTED: 'default',
    };
    
    const labels: Record<string, string> = {
      HANDOVER_REQUESTED: 'Đang chờ',
      HANDOVER_ACCEPTED: 'Đã nhận',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <>
      <Header title="Staff Panel" description="Quản lý yêu cầu hỗ trợ" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có yêu cầu hỗ trợ nào
            </div>
          ) : (
            conversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {conversation.user?.name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription>{conversation.user?.email}</CardDescription>
                    </div>
                    {getStatusBadge(conversation.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversation.handoverReason && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Lý do:</p>
                      <p className="text-sm text-muted-foreground">{conversation.handoverReason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {conversation.messages?.length || 0} tin nhắn
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(conversation.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {conversation.status === 'HANDOVER_REQUESTED' && (
                      <Button onClick={() => handleAcceptHandover(conversation.id)}>
                        Nhận hỗ trợ
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/chat?id=${conversation.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}