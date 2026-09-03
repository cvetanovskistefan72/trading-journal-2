export const routes = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  setPassword: "/set-password",
  changePassword: "/change-password",
  dashboard: "/dashboard",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
} as const;

export type Route = (typeof routes)[keyof typeof routes];
