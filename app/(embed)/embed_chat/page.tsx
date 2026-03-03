'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import EmbedHeader from '@/components/layout/HeaderForEmbed';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChatStore } from '@/store/chatStore';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmbedChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');

  const { currentConversation, setCurrentConversation } = useChatStore();

  const [loadingConversation, setLoadingConversation] = useState(false);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverReason, setHandoverReason] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);

  /* ===============================
     LOAD CONVERSATION THEO URL
  =============================== */
  useEffect(() => {
    if (!conversationId) {
      setCurrentConversation(null);
      return;
    }

    const loadConversation = async () => {
      setLoadingConversation(true);
      setCurrentConversation(null);

      try {
        const res = await fetch(
          `/api/conversations?id=${conversationId}`
        );

        if (!res.ok) return;

        const data = await res.json();
        setCurrentConversation(data);
      } catch (err) {
        console.error('Load conversation error:', err);
      } finally {
        setLoadingConversation(false);
      }
    };

    loadConversation();
  }, [conversationId, setCurrentConversation]);

  const handleRequestHandover = () => {
    setShowHandoverDialog(true);
  };

  const handleConfirmHandover = async () => {
    if (!currentConversation?.id) return;

    setHandoverLoading(true);

    try {
      const response = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          reason: handoverReason,
          action: 'request',
        }),
      });

      if (response.ok) {
        setShowHandoverDialog(false);
        setHandoverReason('');
      }
    } catch (error) {
      console.error('Handover error:', error);
    } finally {
      setHandoverLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background px-5">
        <EmbedHeader
          title="Chat"
          description="Trò chuyện với AI hỗ trợ khách hàng"
        />

        <div className="flex-1 overflow-hidden p-6">
          <Card className="h-full flex flex-col relative">
            {loadingConversation && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            )}

            <ChatInterface
              key={conversationId || 'new'}
              onRequestHandover={handleRequestHandover}
              canRequestHandover={session?.user?.role === 'USER'}
            />
          </Card>
        </div>

        <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Yêu cầu hỗ trợ nhân viên
              </DialogTitle>
              <DialogDescription>
                Vui lòng mô tả ngắn gọn vấn đề bạn cần hỗ trợ
              </DialogDescription>
            </DialogHeader>

            <Input
              placeholder="Ví dụ: Cần tư vấn về sản phẩm..."
              value={handoverReason}
              onChange={(e) => setHandoverReason(e.target.value)}
              maxLength={200}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowHandoverDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmHandover}
                disabled={
                  handoverLoading || !handoverReason.trim()
                }
              >
                {handoverLoading
                  ? 'Đang gửi...'
                  : 'Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}