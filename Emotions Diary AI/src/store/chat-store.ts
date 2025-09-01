import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '@/services/ai-service';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      isLoading: false,

      addMessage: (message) => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              timestamp: new Date()
            }
          ]
        }));
      },

      updateLastMessage: (content) => {
        set((state) => {
          const messages = [...state.messages];
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = content;
          }
          
          return { messages };
        });
      },

      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      clearChat: () => set({ messages: [] })
    }),
    {
      name: 'ai-chat-storage',
      partialize: (state) => ({
        messages: state.messages
      })
    }
  )
);