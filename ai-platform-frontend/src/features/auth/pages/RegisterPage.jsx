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
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../../app/shared/components/Notification";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordError(validateConfirmPassword(confirmPassword));
  };

  async function handleRegister(e) {
    e.preventDefault();

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (emailErr || passwordErr || confirmPasswordErr) {
      showNotification("Please fix the errors in the form", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", { email, password });
      showNotification(
        "Account created successfully! You can now login.",
        "success"
      );
      navigate("/login");
    } catch (err) {
      showNotification(
        err.response?.data?.detail || "Registration failed. Please try again.",
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
          Create Account
        </Typography>

        <form onSubmit={handleRegister}>
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

            <TextField
              label="Confirm Password"
              fullWidth
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              onBlur={handleConfirmPasswordBlur}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              disabled={loading}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : "Register"}
            </Button>

            <Button
              fullWidth
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Already have an account?
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
