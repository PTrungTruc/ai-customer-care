'use client';

import { ChatMessage as ChatMessageType } from '@/types';
import { Bot, User as UserIcon, UserCog } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStaff = message.role === 'staff';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start mb-4`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : isStaff ? 'bg-green-500' : 'bg-purple-500'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-5 h-5 text-white" />
        ) : isStaff ? (
          <UserCog className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[80%] ${
          isUser ? 'bg-blue-500 text-white' : 'bg-muted'
        } rounded-2xl px-4 py-3`}
      >
        {isStaff && message.userName && (
          <div className="text-xs font-semibold mb-1 text-green-600">{message.userName}</div>
        )}
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}