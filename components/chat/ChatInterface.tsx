'use client';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import { useChatRealtime } from '@/hooks/useChatRealtime';
interface Message {
  role: 'user' | 'assistant' | 'staff';
  content: string;
  userId?: string | null;
  // Bỏ field sources vì không dùng nữa
}

interface ChatInterfaceProps {
  onRequestHandover: () => void;
  canRequestHandover: boolean;
}

export default function ChatInterface({ onRequestHandover, canRequestHandover }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  let roleUser: Message['role'] = 'user';
  const [historyLoading, setHistoryLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('id');

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId
  );

  useChatRealtime(conversationId, setMessages);
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = conversationId
        ? `/api/chat?conversationId=${conversationId}`
        : '/api/chat';

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setMessages(
          data.history.map((h: any) => {
            return ({
              role: h.role,
              userId: h.userId,
              content: h.content,
            })
          })
        );
      }
    } catch (e) {
      console.error('Lỗi tải lịch sử:', e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Tải lịch sử chat khi mới vào
  useEffect(() => {
    fetchHistory();
  }, [conversationId]);

  useEffect(() => {
    fetchHistory();
    if (!conversationId) return;

    const es = new EventSource(
      `/api/chat/stream?conversationId=${conversationId}`
    );

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);

      if (payload.type === 'new_message') {
        setMessages(prev => {
          prev.filter(
            m => typeof m.content === 'string' && m.content.trim() !== ''
          )
          // tránh duplicate khi reload
          if (prev.some(m => m.userId === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [conversationId]);


  // 2. Tự động cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 3. Gửi tin nhắn
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: roleUser, content: input, userId: session?.user?.id };
    setMessages(prev => [...prev, userMsg])
    fetchHistory()
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, conversationId, role: userMsg.role }),
      });

      // const data = await response.json();
      // if (data.success) {
      //   const aiMsg: Message = {
      //     role: 'assistant',
      //     content: data.answer,
      //   };
      //   setMessages(prev => [...prev, aiMsg]);
      // } else {
      //   setMessages(prev => [...prev, {
      //     role: 'assistant',
      //     content: '⚠️ Có lỗi xảy ra: ' + (data.error || 'Server error')
      //   }]);
      // }
      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let aiContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          console.log(line);
          if (!line.startsWith('data: ')) continue

          const payload = JSON.parse(line.replace('data: ', ''))

          if (payload.type === 'meta') {
            // ✅ LƯU conversationId
            if (!conversationId && payload.conversationId) {
              setConversationId(payload.conversationId);

              // cập nhật URL để reload không mất
              const url = new URL(window.location.href);
              url.searchParams.set('id', payload.conversationId);
              window.history.replaceState({}, '', url.toString());
            }
          }

          if (payload.type === 'token') {
            aiContent += payload.token
            setMessages(prev => {
              const last = prev.at(-1)
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: aiContent }]
              }
              // return [...prev]
              return [...prev, { role: payload.role ?? 'user', content: aiContent }]
            })
          }

          if (payload.type === 'done') {
            // optional: finalize
            fetchHistory()
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Lỗi kết nối server.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Màn hình chào mừng */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium">Xin chào! Mình là GEMINI 2.5</p>
          </div>
        )}

        {/* Danh sách tin nhắn */}
        {messages.map((msg, idx) => {
          if (msg.content == "" || !msg.content) return;
          const isUser = msg.userId === session?.user?.id;
          if (isUser) { roleUser = msg.role }
          return (

            <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* 🟢 ICON AI BÉ BÉ XINH XINH (Chỉ hiện khi là assistant) */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 min-w-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md mt-1">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Bong bóng chat */}
                <div
                  className={`px-5 py-3 shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none'
                    }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )
        })}

        {/* Loading Indicator có Icon */}
        {loading && (
          <div className="flex justify-start w-full gap-3">
            <div className="w-8 h-8 min-w-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md mt-1 animate-pulse">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* KHUNG NHẬP LIỆU */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn..."
            rows={1}
            className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl px-6 py-2 font-medium shadow-md transition-colors flex items-center justify-center min-w-[80px]"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-slate-400">AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</p>
        </div>
        {/* Hiển thị nút yêu cầu hỗ trợ khi điều kiện đúng */}
        {canRequestHandover && (
          <div className="mt-2 text-center">
            <Button onClick={onRequestHandover} variant="outline" disabled={!conversationId ? true : false}>
              Yêu cầu hỗ trợ nhân viên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}