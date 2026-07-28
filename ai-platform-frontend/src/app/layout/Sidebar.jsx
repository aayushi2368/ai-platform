import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { useChatStore } from "../../features/rag/store/chatStore";
import { useNotificationStore } from "../shared/components/Notification";

const drawerWidth = 280;

export default function Sidebar() {
  // Zustand store selectors
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const loadChats = useChatStore((s) => s.loadChats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const loadingChats = useChatStore((s) => s.loadingChats);
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [deletingChatId, setDeletingChatId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // Load chats on first mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleDeleteClick = (chatId, event) => {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    setChatToDelete(chatId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    setConfirmDialogOpen(false);
    setDeletingChatId(chatToDelete);

    try {
      await deleteChat(chatToDelete);
      showNotification("Chat deleted successfully", "success");
    } catch (error) {
      showNotification("Failed to delete chat. Please try again.", "error");
    } finally {
      setDeletingChatId(null);
      setChatToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setChatToDelete(null);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      <Toolbar />

      <List dense>
        {loadingChats && (
          <ListItemButton disabled>
            <ListItemText primary="Loading chats…" />
          </ListItemButton>
        )}

        {!loadingChats && chats.length === 0 && (
          <ListItemButton disabled>
            <ListItemText primary="No chats yet" />
          </ListItemButton>
        )}

        {chats.map((c) => (
          <ListItemButton
            key={c.chat_id}
            selected={c.chat_id === activeChatId}
            onClick={() => setActiveChat(c.chat_id)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              "&:hover .delete-btn": { opacity: 1 },
            }}
          >
            <ListItemText
              primary={c.title}
              secondary={c.document_id?.slice(0, 8)}
              sx={{ pr: 1 }}
            />
            <IconButton
              className="delete-btn"
              size="small"
              onClick={(e) => handleDeleteClick(c.chat_id, e)}
              disabled={deletingChatId === c.chat_id}
              sx={{
                opacity: 0,
                transition: "opacity 0.2s",
                "&:hover": { color: "error.main" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chat? This action cannot be
            undone and all messages will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
