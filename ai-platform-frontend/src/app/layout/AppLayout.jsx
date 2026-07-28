import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { useChatStore } from "../../features/rag/store/chatStore";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AppLayout() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  // Load user data from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Topbar onNewChat={() => setActiveChat(null)} />
      <Sidebar chats={chats} activeId={activeChatId} onSelect={setActiveChat} />
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1000, mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
