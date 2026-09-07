export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isActive: boolean;
  canResend: boolean;
  disabled: boolean;
};
