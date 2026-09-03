"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Users,
} from "lucide-react";

const nav = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/activity", label: "Activity", icon: Activity },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/overview") return pathname === "/overview";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-navy text-sidebar-text">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-[15px] font-semibold tracking-[0.22em] text-white">
          ACME
        </div>
        <div className="mt-1 text-[11px] tracking-[0.04em] text-sidebar-text">
          Enterprise Operations
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 items-center gap-2.5 rounded px-2.5 text-[13px] ${
                active
                  ? "bg-navy-active text-sidebar-text-active"
                  : "hover:bg-navy-hover hover:text-white"
              }`}
            >
              <Icon className="size-4 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="text-[12px] text-white">Jordan Hale</div>
        <div className="mt-0.5 text-[11px] text-sidebar-text">Billing operations</div>
      </div>
    </aside>
  );
}
