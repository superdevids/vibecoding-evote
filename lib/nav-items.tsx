import type { ReactNode } from "react"
import {
  LayoutDashboard,
  Users,
  Vote,
  BarChart3,
  MessageSquare,
  Megaphone,
  FileText,
  Settings,
  Shield,
  FileBarChart,
  Building2,
  CheckCircle2,
  Bell,
  FileSearch,
  AlertTriangle,
  UserCog,
} from "lucide-react"

export interface NavItem {
  title: string
  icon: ReactNode
  href: string
  roles?: string[]
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    href: "/dashboard",
  },
  {
    title: "Anggota",
    icon: <Users className="h-4 w-4" />,
    href: "/members",
    roles: ["super-admin", "election-committee"],
  },
  {
    title: "Voting/Poll",
    icon: <Vote className="h-4 w-4" />,
    href: "/polls",
  },
  {
    title: "Vote Saya",
    icon: <CheckCircle2 className="h-4 w-4" />,
    href: "/my-votes",
    roles: ["member"],
  },
  {
    title: "Hasil & Rekap",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/results",
  },
  {
    title: "Verifikasi Integritas",
    icon: <Shield className="h-4 w-4" />,
    href: "/verification",
  },
  {
    title: "Diskusi",
    icon: <MessageSquare className="h-4 w-4" />,
    href: "/discussions",
  },
  {
    title: "Pengumuman",
    icon: <Megaphone className="h-4 w-4" />,
    href: "/announcements",
  },
  {
    title: "Dokumen",
    icon: <FileText className="h-4 w-4" />,
    href: "/documents",
  },
  {
    title: "Laporan",
    icon: <FileBarChart className="h-4 w-4" />,
    href: "/reports",
    roles: ["super-admin", "election-committee", "verifier"],
  },
  {
    title: "Unit Organisasi",
    icon: <Building2 className="h-4 w-4" />,
    href: "/organization-units",
    roles: ["super-admin"],
  },
  {
    title: "Notifikasi",
    icon: <Bell className="h-4 w-4" />,
    href: "/notifications",
  },
  {
    title: "Audit Log",
    icon: <FileSearch className="h-4 w-4" />,
    href: "/audit-log",
    roles: ["super-admin", "election-committee"],
  },
  {
    title: "Sengketa",
    icon: <AlertTriangle className="h-4 w-4" />,
    href: "/disputes",
    roles: ["super-admin", "election-committee", "member"],
  },
  {
    title: "Pengguna",
    icon: <UserCog className="h-4 w-4" />,
    href: "/users",
    roles: ["super-admin"],
  },
  {
    title: "Pengaturan",
    icon: <Settings className="h-4 w-4" />,
    href: "/settings",
    roles: ["super-admin"],
  },
]
