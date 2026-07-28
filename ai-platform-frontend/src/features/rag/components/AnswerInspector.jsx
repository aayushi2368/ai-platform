import { useState } from "react";
import { Box, Collapse, Divider, IconButton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function AnswerInspector({ msg }) {
  const [open, setOpen] = useState(false);

  if (msg.role !== "assistant") return null;

  // Parse JSON fields if necessary
  let sources = [];
  let meta = {};

  try {
    if (msg.sources) sources = JSON.parse(msg.sources);
  } catch {
    sources = [];
  }

  try {
    if (msg.meta) meta = JSON.parse(msg.meta);
  } catch {
    meta = {};
  }

  return (
    <Box
      sx={{
        backgroundColor: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: 1,
        mt: 0.5,
        mb: 1,
        p: 1,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Details
        </Typography>
        <IconButton size="small" onClick={() => setOpen((o) => !o)}>
          <ExpandMoreIcon
            sx={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Divider sx={{ my: 1 }} />

        {/* Sources */}
        <Typography variant="subtitle2">Sources:</Typography>
        {Array.isArray(sources) && sources.length > 0 ? (
          sources.map((s, i) => <div key={i}>• {s}</div>)
        ) : (
          <div style={{ opacity: 0.6 }}>none</div>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Meta */}
        <Typography variant="subtitle2">Meta:</Typography>
        <Typography variant="caption">
          Model: {meta.model || "unknown"} • Latency: {meta.latency_ms || 0} ms
        </Typography>
      </Collapse>
    </Box>
  );
}
