export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLM {
  streamChat(
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): Promise<void>

  embed(text: string): Promise<number[]>

  generateTitle(text: string): Promise<string>
}
