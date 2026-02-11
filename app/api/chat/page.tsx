'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: userMsg.content })
    });
    const data = await res.json();
    
    setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col p-4">
      <div className="flex-1 overflow-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="text-gray-400">AI đang suy nghĩ...</div>}
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Hỏi gì đó..."
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded">Gửi</button>
      </div>
    </div>
  );
}