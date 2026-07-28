// src/app/App.jsx
import { RouterProvider } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { router } from "./routes";
import { useAuthStore } from "../features/auth/store/authStore";
import Notification from "./shared/components/Notification";

useAuthStore.getState().loadFromStorage();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Notification />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
