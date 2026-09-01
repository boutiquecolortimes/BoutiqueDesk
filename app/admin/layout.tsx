import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { visibleNavItems } from "@/components/admin/nav-items";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { UserMenu } from "@/components/admin/user-menu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const items = visibleNavItems(session.role);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <Link href="/admin" className="mb-6 px-2 text-lg font-semibold tracking-tight">
          BoutiqueDesk
        </Link>
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <MobileNav items={items} />
            <span className="text-sm font-medium md:hidden">BoutiqueDesk</span>
          </div>
          <UserMenu name={session.name} email={session.email} role={session.role} />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
