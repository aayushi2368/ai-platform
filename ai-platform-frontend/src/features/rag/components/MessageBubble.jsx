import { Box, Typography, Paper } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 1,
        mb: 1,
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isUser ? "primary.main" : "secondary.main",
          color: "white",
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <PersonIcon fontSize="small" />
        ) : (
          <SmartToyIcon fontSize="small" />
        )}
      </Box>

      {/* Message Bubble */}
      <Paper
        elevation={1}
        sx={{
          backgroundColor: isUser ? "primary.main" : "grey.100",
          color: isUser ? "white" : "text.primary",
          p: 1.5,
          borderRadius: 2,
          maxWidth: "70%",
          wordWrap: "break-word",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          {msg.content}
        </Typography>
      </Paper>
    </Box>
  );
}
