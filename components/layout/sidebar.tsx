"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

export function Sidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const { collapsed, setCollapsed } = useSidebar();

	const userRole = session?.user?.roleId;

	const filteredItems = navItems.filter((item) => {
		if (!item.roles) return true;
		if (!userRole) return false;
		return item.roles.includes(userRole);
	});

	return (
		<aside className={cn("flex flex-col h-full border-r bg-sidebar-background transition-all duration-300", collapsed ? "w-16" : "w-72")}>
			<div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
				<Link
					href="/dashboard"
					className={cn("flex items-center gap-2 cursor-pointer", collapsed && "justify-center w-full")}
					title={collapsed ? "EVote" : undefined}
				>
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
						<Lock className="h-4 w-4 text-white" />
					</div>
					{!collapsed && <span className="font-semibold text-sm">EVote</span>}
				</Link>
				{!collapsed && (
					<button
						onClick={() => setCollapsed(true)}
						className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
						title="Sembunyikan sidebar"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			<nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
				{filteredItems.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn("flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer border-l-2", collapsed && "justify-center px-2", isActive ? "bg-primary/10 text-primary border-l-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-transparent")}
							title={collapsed ? item.title : undefined}
						>
							<span className="shrink-0">{item.icon}</span>
							{!collapsed && <span className="truncate">{item.title}</span>}
						</Link>
					);
				})}
			</nav>

			{collapsed && (
				<div className="border-t p-2 shrink-0">
					<button
						onClick={() => setCollapsed(false)}
						className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
						title="Perluas sidebar"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			)}
		</aside>
	);
}
