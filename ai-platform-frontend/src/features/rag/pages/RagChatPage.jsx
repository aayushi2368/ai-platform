import { useEffect } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import DescriptionIcon from "@mui/icons-material/Description";

import { useChatStore } from "../store/chatStore";
import UploadPanel from "../components/UploadPanel";
import MessagesPanel from "../components/MessagesPanel";
import QuestionPanel from "../components/QuestionPanel";

export default function RagChatPage() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const messages = useChatStore((s) => s.messages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);

  const loadChats = useChatStore((s) => s.loadChats);

  // Load chats on first mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Find the active chat
  const chat = chats.find((c) => c.chat_id === activeChatId) || null;

  // No chat selected yet - show upload panel
  if (!chat) {
    return (
      <>
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ChatIcon />
              <Typography variant="h5" fontWeight={600}>
                Welcome to AI Chat
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Upload a PDF to start a new chat or choose an existing chat from
              the sidebar.
            </Typography>
          </CardContent>
        </Card>
        <UploadPanel />
      </>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* If no document attached yet → show upload */}
      {!chat.document_id && <UploadPanel chat={chat} />}

      {/* If PDF is attached → load messages + question input */}
      {chat.document_id && (
        <>
          {/* Chat Header */}
          <Box
            sx={{
              mb: 2,
              pb: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <DescriptionIcon color="primary" />
            <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
              {chat.title}
            </Typography>
            <Chip
              label={`${messages.length} messages`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* Messages Area */}
          <MessagesPanel messages={messages} loading={loadingMessages} />

          {/* Question Input */}
          <QuestionPanel chat={chat} />
        </>
      )}
    </Box>
  );
}
