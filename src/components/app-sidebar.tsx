import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  GraduationCap,
  UserCircle2,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL, type AppRole } from "@/lib/auth-helpers";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["student", "teacher", "admin"] },
  { title: "Notices", url: "/notices", icon: Megaphone, roles: ["student", "teacher", "admin"] },
  { title: "Resources & PYQ", url: "/resources", icon: BookOpen, roles: ["student", "teacher", "admin"] },
  { title: "Events", url: "/events", icon: Calendar, roles: ["student", "teacher", "admin"] },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck, roles: ["student", "teacher", "admin"] },
  { title: "Admin Panel", url: "/admin", icon: ShieldCheck, roles: ["admin"] },
];

export function AppSidebar() {
  const { profile, role, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = NAV.filter((n) => n.roles.includes(role));
  const initials = (profile?.full_name || profile?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold">DeptPortal</span>
            <span className="text-xs text-muted-foreground">Department Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile">
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium">{profile?.full_name || "User"}</div>
            <div className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 group-data-[collapsible=icon]:hidden"
            onClick={() => signOut()}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
