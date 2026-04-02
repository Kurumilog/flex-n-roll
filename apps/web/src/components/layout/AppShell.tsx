"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  ChartBar,
  GearSix,
  House,
  List,
  SignOut,
  UserCircle,
  X,
} from "@phosphor-icons/react";

import { useAuthMe, useLogoutMutation } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

type NavItem = {
  href: string;
  label: string;
  icon: typeof House;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/analytics", label: "Analytics", icon: ChartBar },
  { href: "/settings", label: "Settings", icon: GearSix },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const meQuery = useAuthMe();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  useEffect(() => {
    if (meQuery.isError) {
      router.replace("/login");
    }
  }, [meQuery.isError, router]);

  const currentTitle = pageTitles[pathname] ?? "Workspace";

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[var(--bg)] px-3 py-4 text-[var(--text)] sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="surface-shell p-2">
          <div className="surface-panel overflow-hidden">
            <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 md:grid-cols-[292px_minmax(0,1fr)]">
              <aside className="hidden border-r border-[var(--line)] bg-[var(--surface)] md:flex md:flex-col">
                <DesktopSidebar
                  pathname={pathname}
                  navItems={navItems}
                  userName={meQuery.data?.user.name ?? "Manager"}
                  userRole={meQuery.data?.user.role ?? "manager"}
                  isLoggingOut={logoutMutation.isPending}
                  onLogout={logout}
                />
              </aside>

              <section className="flex min-w-0 flex-col">
                <header className="flex min-h-[68px] items-center justify-between border-b border-[var(--line)] px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--accent-deep)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px md:hidden"
                      aria-label="Open navigation"
                      onClick={() => setMobileSidebarOpen(true)}
                    >
                      <List className="h-5 w-5" weight="regular" />
                    </button>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        FLEX-N-ROLL
                      </p>
                      <h1 className="text-lg font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
                        {currentTitle}
                      </h1>
                    </div>
                  </div>
                </header>

                <div className="min-w-0 flex-1 px-2 py-2 sm:px-4 sm:py-4">{children}</div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[rgba(9,15,30,0.42)] backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[86%] max-w-[320px] transform border-r border-[var(--line)] bg-[var(--surface-elevated)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-4">
          <p className="text-sm font-semibold tracking-[0.08em] text-[var(--accent-deep)]">
            Navigation
          </p>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)]"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-[var(--accent-deep)]" weight="regular" />
          </button>
        </div>

        <DesktopSidebar
          pathname={pathname}
          navItems={navItems}
          userName={meQuery.data?.user.name ?? "Manager"}
          userRole={meQuery.data?.user.role ?? "manager"}
          isLoggingOut={logoutMutation.isPending}
          onLogout={logout}
        />
      </aside>
    </main>
  );
}

function DesktopSidebar({
  pathname,
  navItems,
  userName,
  userRole,
  isLoggingOut,
  onLogout,
}: {
  pathname: string;
  navItems: NavItem[];
  userName: string;
  userRole: string;
  isLoggingOut: boolean;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">FLEX-N-ROLL</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
          AI Control Center
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "bg-[var(--accent)] text-white shadow-[0_16px_34px_-20px_rgba(38,66,139,0.58)]"
                  : "text-[var(--accent-deep)] hover:bg-[var(--accent-faint)] hover:-translate-y-0.5 active:translate-y-px",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full",
                  active ? "bg-white/16" : "bg-[var(--surface-soft)]",
                )}
              >
                <Icon className="h-4 w-4" weight="regular" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] px-4 py-4">
        <div className="surface-inset p-4">
          <p className="text-sm font-semibold text-[var(--accent-deep)]">{userName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{userRole}</p>

          <button
            type="button"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--accent-deep)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-70"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <SignOut className="h-4 w-4" weight="regular" />
            {isLoggingOut ? "Выход..." : "Выйти"}
          </button>
        </div>
      </div>
    </div>
  );
}
