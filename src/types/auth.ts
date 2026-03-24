export type UserRole = "owner" | "manager" | "technician" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  organizationId: string | null;
  teamId: string | null;
};

export type AuthSuccessResponse = {
  user: SessionUser;
};
