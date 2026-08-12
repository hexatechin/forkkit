"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  Store,
  FolderTree,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("indocia-token")
        : null;
    if (!t) {
      router.replace("/admin/login");
      return;
    }
    fetch("/api/admin/me", { headers: { Authorization: `Bearer ${t}` } }).then(
      async (r) => {
        if (!r.ok) {
          localStorage.removeItem("indocia-token");
          router.replace("/admin/login");
          return;
        }
        const d = await r.json();
        setUser(d.user);
        setTenant(d.tenant);
        setReady(true);
      },
    );
  }, [pathname]);

  // Auto-close on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile sidebar open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready)
    return (
      <div className="p-10 text-center text-muted-foreground">Loading...</div>
    );

  const logout = () => {
    localStorage.clear();
    router.replace("/admin/login");
  };
  const NavItem = ({ href, icon: Icon, children }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${pathname === href ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-12 w-28 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white text-sm">
            <img
              src="/indocia.png"
              alt="Indocia"
              className="h-12 w-28 rounded-xl object-cover"
            />
          </span>
        </div>
        <div className="w-9" />
      </header>

      {/* Backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transform transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between font-bold px-4 py-4 lg:py-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-12 w-28 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white shadow">
              <img
                src="/indocia.png"
                alt="Indocia"
                className="h-12 w-28 rounded-xl object-cover"
              />
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto px-4">
          <NavItem href="/admin" icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem href="/admin/categories" icon={FolderTree}>
            Categories
          </NavItem>
          <NavItem href="/admin/products" icon={Package}>
            Products
          </NavItem>
          <NavItem href="/admin/orders" icon={ClipboardList}>
            Orders
          </NavItem>
          <NavItem href="/admin/settings" icon={Settings}>
            Settings
          </NavItem>
        </nav>
        <div className="border-t p-4 shrink-0">
          <div className="px-1 py-2">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize truncate">
              {user?.role} · {tenant?.name}
            </div>
          </div>
          {tenant?.slug && (
            <Link
              href={`${tenant.slug}.${window.location.host}`}
              target="_blank"
            >
              <Button variant="outline" size="sm" className="w-full mb-2">
                <Store className="h-3.5 w-3.5 mr-2" />
                View storefront
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen p-4 sm:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
