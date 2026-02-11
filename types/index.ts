export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'staff';
  content: string;
  createdAt: Date;
  userId?: string;
  userName?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'HANDOVER_REQUESTED' | 'HANDOVER_ACCEPTED' | 'CLOSED';
  staffId?: string;
  handoverReason?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  user?: {
    name: string;
    email: string;
  };
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  category?: string;
  version: string;
  status: string;
  chunks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RAGContext {
  content: string;
  metadata: {
    filename: string;
    category: string | null;
    score: number;
  };
}

export interface DocumentChunkVector {
  id: string
  content: string
  embedding: number[]
  document: {
    filename: string
    category?: string
  }
}

export interface RAGResult {
  content: string
  filename: string
  category?: string
  score: number
}

export interface StreamResponse {
  token?: string;
  done?: boolean;
  error?: string;
}

export interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  totalHandovers: number;
  avgResponseTime: number;
  topQuestions: {
    question: string;
    count: number;
  }[];
  conversationsByDay: {
    date: string;
    count: number;
  }[];
}

export type UserRole = 'USER' | 'STAFF' | 'ADMIN';