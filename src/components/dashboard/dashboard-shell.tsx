"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PlaySquare,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type RoleShell = "student" | "instructor";

const nav = {
  instructor: [
    { href: "/instructor", labelKey: "nav.overview", icon: LayoutDashboard },
    { href: "/instructor/courses", labelKey: "nav.courses", icon: BookOpen },
    { href: "/instructor/exercises", labelKey: "nav.exercises", icon: ClipboardList },
    { href: "/instructor/students", labelKey: "nav.students", icon: Users },
    { href: "/instructor/results", labelKey: "nav.results", icon: BarChart3 },
  ],
  student: [
    { href: "/student", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { href: "/student/course", labelKey: "nav.course", icon: PlaySquare },
    { href: "/student/progress", labelKey: "nav.progress", icon: Trophy },
  ],
};

export function DashboardShell({
  role,
  userName,
  userEmail,
  children,
}: {
  role: RoleShell;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, direction } = useI18n();
  const [open, setOpen] = useState(false);
  const items = nav[role];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link href={role === "instructor" ? "/instructor" : "/student"} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
            {role === "instructor" ? <Settings className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t("brand.short")}</p>
            <p className="text-xs text-slate-500">
              {role === "instructor" ? t("nav.instructorDashboard") : t("nav.studentSpace")}
            </p>
          </div>
        </Link>
        <button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-cyan-300/25">
            <Image src="/images/ahmed-abdelmegid.jpg" alt={t("brand.instructor")} fill className="object-cover" sizes="48px" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{t("brand.instructor")}</p>
            <p className="truncate text-xs text-cyan-200">{t("brand.programmingInstructor")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-cyan-300/12 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 min-w-0">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur lg:hidden">
        <button className="rounded-lg p-2 text-slate-300" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-white">{t("brand.short")}</p>
        <LanguageSwitcher compact />
        <div className="h-9 w-9" />
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed top-0 z-50 flex h-screen w-72 flex-col border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-transform lg:translate-x-0",
          direction === "rtl" ? "right-0 border-l" : "left-0 border-r",
          open ? "translate-x-0" : direction === "rtl" ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {content}
      </aside>

      <main className={cn("min-h-screen px-4 pb-10 pt-20 lg:px-8 lg:pt-8", direction === "rtl" ? "lg:mr-72" : "lg:ml-72")}>{children}</main>
    </div>
  );
}
