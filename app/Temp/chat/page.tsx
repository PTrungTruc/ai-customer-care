'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    fetch('/api/chat').then(res => res.json()).then(data => {
      if (data.history) setMessages(data.history);
    });
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // 1. Hiện câu hỏi của User ngay lập tức
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2. Gửi lên Server và ĐỢI (không stream)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      const data = await res.json();

      if (data.success) {
        // 3. Server trả về kết quả -> Hiện ra
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Mất kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-700 font-bold text-xl">AI Assistant</div>
        <div className="flex-1 p-4">
          <button onClick={() => router.push('/admin')} className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded text-left mb-2 text-sm">
            ⚙️ Quản lý kiến thức
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        <header className="bg-white p-4 shadow-sm border-b flex justify-between items-center z-10">
          <h1 className="font-bold text-gray-700">Trợ lý ảo thông minh</h1>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Online</span>
        </header>

        {/* Khung chat */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-4xl mb-4">👋</p>
              <p>Xin chào, tôi có thể giúp gì cho bạn?</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
              )}
              
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {/* Loading Indicator cũ - Hiển thị 3 chấm khi đang đợi */}
          {loading && (
            <div className="flex justify-start gap-4">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
               <div className="bg-gray-100 p-4 rounded-2xl text-gray-500 text-sm italic">
                  Đang suy nghĩ...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 outline-none shadow-sm"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="absolute right-3 top-3 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
              🚀
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}