import { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import api from "../../../lib/apiClient";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../../app/shared/components/Notification";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const showNotification = useNotificationStore((s) => s.showNotification);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email";
    }
    return "";
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  async function handleLogin(e) {
    e.preventDefault();

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      showNotification("Please fix the errors in the form", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.access_token);
      showNotification("Login successful! Welcome back.", "success");
      navigate("/");
    } catch (err) {
      showNotification(
        err.response?.data?.detail || "Invalid credentials. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 10 }} variant="outlined">
      <CardContent>
        <Typography
          variant="h5"
          sx={{ mb: 3, textAlign: "center", fontWeight: 600 }}
        >
          Welcome Back
        </Typography>

        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={handleEmailBlur}
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
            />

            <TextField
              label="Password"
              fullWidth
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onBlur={handlePasswordBlur}
              error={!!passwordError}
              helperText={passwordError}
              disabled={loading}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : "Login"}
            </Button>

            <Button
              fullWidth
              onClick={() => navigate("/register")}
              disabled={loading}
            >
              Create an account
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
