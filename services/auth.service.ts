import axiosInstance from "@/lib/axios";

export async function getSetPasswordUser(token: string) {
  const { data } = await axiosInstance.get<{ id: string; email: string }>(
    `/api/auth/set-password?token=${encodeURIComponent(token)}`
  );
  return data;
}

export async function setPassword(token: string, password: string) {
  const { data } = await axiosInstance.post<{ success: true }>(
    "/api/auth/set-password",
    { token, password }
  );
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await axiosInstance.post<{ success: true }>(
    "/api/auth/forgot-password",
    { email }
  );
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const { data } = await axiosInstance.post<{ success: true }>(
    "/api/auth/change-password",
    { currentPassword, newPassword }
  );
  return data;
}
