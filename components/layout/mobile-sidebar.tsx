"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { X, Lock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface MobileSidebarProps {
	open: boolean;
	onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
	const pathname = usePathname();
	const { data: session } = useSession();

	const userRole = session?.user?.roleId;

	const filteredItems = navItems.filter((item) => {
		if (!item.roles) return true;
		if (!userRole) return false;
		return item.roles.includes(userRole);
	});

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	return (
		<>
			{/* Backdrop */}
			<div
				className={cn("fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ease-in-out lg:hidden", open ? "opacity-100" : "opacity-0 pointer-events-none")}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<div
				className={cn("fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar-background shadow-2xl transition-transform duration-300 ease-in-out lg:hidden", open ? "translate-x-0" : "-translate-x-full")}
				style={{ width: "min(85vw, 320px)" }}
				role="dialog"
				aria-modal="true"
				aria-label="Navigasi"
			>
				{/* Header */}
				<div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
							<Lock className="h-4.5 w-4.5 text-white" />
						</div>
						<span className="font-semibold text-sm">EVote</span>
					</div>
					<button
						onClick={onClose}
						className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
						aria-label="Tutup menu"
					>
						<X className="h-4.5 w-4.5" />
					</button>
				</div>

				{/* User info */}
				{session?.user && (
					<div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">{session.user.name?.charAt(0)?.toUpperCase() || "U"}</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium truncate">{session.user.name}</p>
							<p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
						</div>
					</div>
				)}

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto py-2">
					{filteredItems.map((item) => {
						const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className={cn("flex items-center gap-3.5 mx-2 px-3.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer min-h-[44px]", isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
							>
								<span className="shrink-0 flex items-center justify-center w-5 h-5">{item.icon}</span>
								<span className="truncate">{item.title}</span>
							</Link>
						);
					})}
				</nav>

				{/* Logout */}
				<div className="border-t p-2 shrink-0">
					<button
						onClick={() => signOut({ callbackUrl: "/login" })}
						className="flex items-center gap-3.5 mx-2 px-3.5 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer min-h-[44px]"
					>
						<LogOut className="h-4 w-4 shrink-0" />
						<span>Keluar</span>
					</button>
				</div>
			</div>
		</>
	);
}
