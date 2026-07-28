import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  LinearProgress,
  Stack,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import api from "../../../lib/apiClient";
import { useChatStore } from "../store/chatStore";
import { useNotificationStore } from "../../../app/shared/components/Notification";

export default function QuestionPanel({ chat }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const loadMessages = useChatStore((s) => s.loadMessages);
  const showNotification = useNotificationStore((s) => s.showNotification);

  const chatId = chat.chat_id; // backend uses chat_id, not id
  const docId = chat.document_id;

  async function handleAsk() {
    if (!question.trim()) {
      showNotification("Please enter a question", "warning");
      return;
    }

    if (!chatId || !docId) {
      showNotification("Missing chat or document information", "error");
      return;
    }

    const userQuestion = question;
    setQuestion("");
    setLoading(true);

    try {
      // 1️⃣ Optimistically add user message to display immediately
      const tempUserMessage = {
        message_id: Date.now(),
        role: "user",
        content: userQuestion,
        created_at: new Date().toISOString(),
      };

      // Update messages in store immediately
      const currentMessages = useChatStore.getState().messages;
      useChatStore.setState({
        messages: [...currentMessages, tempUserMessage],
      });

      // 2️⃣ Send question to backend
      await api.post("/rag/answer", {
        chat_id: chatId,
        document_id: docId,
        question: userQuestion,
        top_k: 5,
      });

      // 3️⃣ Reload messages after backend stores them (includes the answer)
      await loadMessages(chatId);
    } catch (err) {
      console.error(err);
      showNotification(
        err.response?.data?.detail || "Failed to get answer. Please try again.",
        "error"
      );
      // Reload messages to remove temporary message if error occurred
      await loadMessages(chatId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{ position: "sticky", bottom: 0, bgcolor: "background.paper" }}
    >
      {loading && <LinearProgress />}
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Ask something about this PDF..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            disabled={loading}
            multiline
            maxRows={4}
          />

          <IconButton
            color="primary"
            disabled={!docId || loading || !question.trim()}
            onClick={handleAsk}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": { bgcolor: "primary.dark" },
              "&:disabled": { bgcolor: "action.disabledBackground" },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
