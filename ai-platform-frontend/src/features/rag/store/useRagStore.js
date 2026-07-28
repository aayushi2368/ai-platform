import { create } from "zustand";

export const useRagStore = create((set) => ({
  chats: [], // [{id, title, documentId, messages: []}]
  activeChatId: null,

  createChat: ({ title, documentId }) => {
    const id = crypto.randomUUID();
    const newChat = { id, title, documentId, messages: [] };
    set((s) => ({ chats: [newChat, ...s.chats], activeChatId: id }));
  },

  setActiveChat: (id) => set({ activeChatId: id }),

  appendMessage: (chatId, msg) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c
      ),
    }));
  },

  setChatDocument: (chatId, documentId, title) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, documentId, title } : c
      ),
    }));
  },

  reset: () => set({ chats: [], activeChatId: null }),
}));
