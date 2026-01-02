import api from "./api";

type RegisterDataType = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true, message: "" };
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
};

export const register = async (data: RegisterDataType) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const verifyOTP = async (email: string, otp: string) => {
  const res = await api.post("/auth/verify-otp", { email, otp });
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const getMyDetails = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const refreshTokens = async (refreshToken: string) => {
  const res = await api.post("/auth/refresh", { token: refreshToken });
  return res.data;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("accessToken");
  return !!token;
};

// Get user role
export const getUserRole = (): string[] => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.roles || [];
    } catch {
      return [];
    }
  }
  return [];
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const roles = getUserRole();
  return roles.includes(role);
};