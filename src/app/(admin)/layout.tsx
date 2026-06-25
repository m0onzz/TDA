import { Sidebar } from "@/components/layout/sidebar";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={user.email} />
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
