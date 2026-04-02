export type UserRole = "manager" | "supervisor" | "admin";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  timezone: string;
  bio?: string;
  avatar?: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string;
};
