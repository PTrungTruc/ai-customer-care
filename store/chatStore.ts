import { create } from 'zustand';
import { ChatMessage, Conversation } from '@/types';

interface ChatStore {
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentConversation: null,
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
  
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content += content;
    }
    
    return { messages };
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setTyping: (typing) => set({ isTyping: typing }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    currentConversation: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
  }),
}));