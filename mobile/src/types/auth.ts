export type UserRole = "buyer" | "seller" | "admin";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser | null;
  message?: string;
}
