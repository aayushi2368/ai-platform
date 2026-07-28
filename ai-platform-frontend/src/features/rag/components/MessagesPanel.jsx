import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import AnswerInspector from "./AnswerInspector";

export default function MessagesPanel({ messages, loading }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      sx={{
        p: 2,
        height: 400,
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        mb: 2,
        bgcolor: "background.paper",
      }}
    >
      {loading ? (
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Loading messages...
        </Typography>
      ) : (
        <Stack spacing={2}>
          {messages.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              Ask your first question to get started…
            </Typography>
          )}

          {messages.map((m) => (
            <div key={m.id}>
              <MessageBubble msg={m} />
              <AnswerInspector msg={m} />
            </div>
          ))}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </Stack>
      )}
    </Box>
  );
}
