import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { routes } from "@/config/routes";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect(routes.login);
  if (user.role !== Role.ADMIN) redirect(routes.dashboard);

  return <>{children}</>;
}
