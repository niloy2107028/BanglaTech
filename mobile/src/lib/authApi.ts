import { api } from "./api";
import { AuthResponse } from "../types/auth";
import { AuthUser } from "../types/auth";

interface BasicResponse {
  success: boolean;
  message: string;
}

export async function registerUser(name: string, email: string, password: string) {
  const { data } = await api.post<BasicResponse>("/api/auth/register", {
    name,
    email,
    password,
    role: "buyer",
  });
  return data;
}

export function getMobileGoogleAuthUrl(redirectUri: string) {
  const baseURL = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const query = new URLSearchParams({ redirectUri }).toString();
  return `${baseURL}/api/auth/google/mobile?${query}`;
}

export function parseGoogleCallbackUrl(url: string): { token?: string; user?: AuthUser } {
  const parsed = new URL(url);
  const token = parsed.searchParams.get("token") || undefined;
  const rawUser = parsed.searchParams.get("user");

  if (!rawUser) {
    return { token };
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    return { token, user };
  } catch {
    return { token };
  }
}

export async function verifyEmailOtp(email: string, otp: string) {
  const { data } = await api.post<AuthResponse>("/api/auth/verify-email", {
    email,
    otp,
    clientType: "mobile",
  });
  return data;
}

export async function resendOtp(email: string, type: "register" | "forgot-password") {
  const { data } = await api.post<BasicResponse>("/api/auth/resend-otp", {
    email,
    type,
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<BasicResponse>("/api/auth/forgot-password", {
    email,
  });
  return data;
}

export async function verifyResetOtp(email: string, otp: string) {
  const { data } = await api.post<BasicResponse>("/api/auth/verify-reset-otp", {
    email,
    otp,
  });
  return data;
}

export async function resetPassword(email: string, otp: string, password: string) {
  const { data } = await api.put<AuthResponse>("/api/auth/reset-password", {
    email,
    otp,
    password,
    clientType: "mobile",
  });
  return data;
}
