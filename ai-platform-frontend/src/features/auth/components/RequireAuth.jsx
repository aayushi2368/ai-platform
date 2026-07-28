import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
