import { create } from "zustand";
import api from "../../../lib/apiClient";

export const useChatStore = create((set) => ({
  chats: [], // backend /chats/list
  activeChatId: null, // selected chat
  messages: [], // messages for active chat
  loadingChats: false,
  loadingMessages: false,

  // Load all chats from backend
  loadChats: async () => {
    set({ loadingChats: true });
    try {
      const res = await api.get("/chats/list");
      set({ chats: res.data, loadingChats: false });
    } catch (err) {
      console.error("Failed to load chats", err);
      set({ loadingChats: false });
    }
  },

  // Select active chat and load its messages
  setActiveChat: async (chatId) => {
    set({ activeChatId: chatId });
    await useChatStore.getState().loadMessages(chatId);
  },

  // Load messages for a chat
  loadMessages: async (chatId) => {
    if (!chatId) return;
    set({ loadingMessages: true });
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      set({ messages: res.data, loadingMessages: false });
    } catch (err) {
      console.error("Failed to load messages", err);
      set({ loadingMessages: false });
    }
  },

  // Create a chat on backend, refresh, and select it
  createChat: async (title, documentId) => {
    const res = await api.post("/chats/create", {
      title,
      document_id: documentId,
    });
    await useChatStore.getState().loadChats();
    await useChatStore.getState().setActiveChat(res.data.chat_id);
    return res.data.chat_id;
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`);

      // If the deleted chat was active, clear it
      const { activeChatId } = useChatStore.getState();
      if (activeChatId === chatId) {
        set({ activeChatId: null, messages: [] });
      }

      // Reload the chat list
      await useChatStore.getState().loadChats();
    } catch (err) {
      console.error("Failed to delete chat", err);
      throw err;
    }
  },
}));
