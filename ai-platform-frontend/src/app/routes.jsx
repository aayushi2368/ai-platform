import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import RagChatPage from "../features/rag/pages/RagChatPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import RequireAuth from "../features/auth/components/RequireAuth";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [{ index: true, element: <RagChatPage /> }],
  },
]);
