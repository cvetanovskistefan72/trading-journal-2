export const routes = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  setPassword: "/set-password",
  changePassword: "/change-password",
  dashboard: "/dashboard",
  analyticsDay: "/analytics/day",
  analyticsStrategies: "/analytics/strategies",
  journal: "/journal",
  adminUsers: "/admin/users",
  adminUsersCreate: "/admin/users/create",
} as const;

export type Route = (typeof routes)[keyof typeof routes];
