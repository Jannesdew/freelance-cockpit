"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  FolderKanban,
  Kanban,
  LayoutDashboard,
  List,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projecten", icon: FolderKanban },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/list", label: "Lijst", icon: List },
];

export function AppSidebar({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const initials = userEmail.slice(0, 2).toUpperCase();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Deliberate escape hatch: next-themes' resolved value can differ between
  // server and first client render, so the icon/switch must stay in their
  // server-rendered state until after mount to avoid a hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Kanban className="size-4" />
          </div>
          <span className="truncate font-medium group-data-[collapsible=icon]:hidden">
            Cockpit
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
                Dark mode
              </span>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <SidebarMenuButton
              tooltip="Dark mode"
              className="hidden group-data-[collapsible=icon]:flex"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Moon /> : <Sun />}
              <span>Dark mode</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                {userEmail}
              </span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton tooltip="Uitloggen" type="submit">
                <LogOut />
                <span>Uitloggen</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
