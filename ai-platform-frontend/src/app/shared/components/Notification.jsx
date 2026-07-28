import { Snackbar, Alert } from "@mui/material";
import { create } from "zustand";

// Global notification store
export const useNotificationStore = create((set) => ({
  open: false,
  message: "",
  severity: "info", // 'success' | 'error' | 'warning' | 'info'

  showNotification: (message, severity = "info") => {
    set({ open: true, message, severity });
  },

  hideNotification: () => {
    set({ open: false });
  },
}));

// Notification component to be placed in App
export default function Notification() {
  const { open, message, severity, hideNotification } = useNotificationStore();

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={hideNotification}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
