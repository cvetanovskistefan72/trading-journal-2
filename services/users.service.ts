import axiosInstance from "@/lib/axios";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isActive: boolean;
  canResend: boolean;
  disabled: boolean;
};

export async function getUsers(): Promise<UserRow[]> {
  const { data } = await axiosInstance.get<UserRow[]>("/api/users");
  return data;
}

export async function createUser(email: string, name: string) {
  const { data } = await axiosInstance.post("/api/users", { email, name });
  return data;
}

export async function toggleUser(id: string) {
  const { data } = await axiosInstance.patch(`/api/users/${id}`);
  return data;
}

export async function resendUserEmail(userId: string) {
  const { data } = await axiosInstance.post(`/api/users/${userId}/resend`);
  return data;
}
