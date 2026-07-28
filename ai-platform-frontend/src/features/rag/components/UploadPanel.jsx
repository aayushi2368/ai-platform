import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Box,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { uploadPdf } from "../services/api"; // adjust path if needed
import { useChatStore } from "../store/chatStore";
import { useNotificationStore } from "../../../app/shared/components/Notification";
import api from "../../../lib/apiClient";

export default function UploadPanel({ chat }) {
  const [loading, setLoading] = useState(false);

  const createChat = useChatStore((s) => s.createChat);
  const loadChats = useChatStore((s) => s.loadChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const showNotification = useNotificationStore((s) => s.showNotification);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      showNotification("Please upload a PDF file", "error");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification("File size must be less than 10MB", "error");
      return;
    }

    setLoading(true);

    try {
      // 1) Upload PDF to backend
      const res = await uploadPdf(file);
      // res = { document_id, filename, num_chunks }

      // 2) Create a chat bound to that document
      if (chat?.chat_id) {
        // If chat exists, update it with document
        await api.patch(`/chats/${chat.chat_id}`, {
          document_id: res.document_id,
          title: res.filename,
        });
        await loadChats();
        await setActiveChat(chat.chat_id);
      } else {
        // Create new chat
        await createChat(res.filename, res.document_id);
      }

      showNotification(
        `${res.filename} uploaded successfully! Chat is ready.`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showNotification(
        err.response?.data?.detail || `Upload failed: ${err.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      {loading && <LinearProgress />}
      <CardContent>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <CloudUploadIcon
            sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
          />

          <Typography variant="h6" gutterBottom>
            Upload a PDF to start a new chat
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Each PDF automatically creates its own chat. Maximum file size: 10MB
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={loading}
            startIcon={<CloudUploadIcon />}
            size="large"
          >
            {loading ? "Uploading..." : "Choose PDF"}
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFile}
              disabled={loading}
            />
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
