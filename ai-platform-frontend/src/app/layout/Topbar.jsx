import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useNotificationStore } from "../shared/components/Notification";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function Topbar({ onNewChat }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const handleLogout = () => {
    logout();
    showNotification("You have been logged out", "info");
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Toolbar>
        <SmartToyIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          AI Platform — Ask your PDF
        </Typography>

        {user && (
          <Chip
            label={user.name || user.email || "User"}
            sx={{
              mr: 2,
              bgcolor: "rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: 500,
            }}
          />
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            color="inherit"
            onClick={onNewChat}
            startIcon={<AddIcon />}
            sx={{ fontWeight: 500 }}
          >
            New Chat
          </Button>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
