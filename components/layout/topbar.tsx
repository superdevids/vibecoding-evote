"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { MobileSidebar } from "./mobile-sidebar";
import { Bell, Menu, LogOut, User, Settings, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

export function Topbar() {
	const { data: session } = useSession();
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		fetch("/api/notifications?unreadCount=true")
			.then((r) => r.json())
			.then((d) => setUnreadCount(d.count || 0))
			.catch(() => {})
	}, [])

	return (
		<>
			<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
				<button
					onClick={() => setMobileMenuOpen(true)}
					className="lg:hidden cursor-pointer"
				>
					<Menu className="h-5 w-5" />
				</button>

				<div className="flex-1" />

				<div className="flex items-center gap-2">
					<button
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors cursor-pointer"
					>
						{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</button>

					<button
						onClick={() => router.push("/notifications")}
						className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors cursor-pointer"
						title="Notifikasi"
					>
						<Bell className="h-4 w-4" />
						{unreadCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-white flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
						)}
					</button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer outline-none">
								<Avatar className="h-7 w-7">
									<AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium hidden sm:block">{session?.user?.name || "User"}</span>
								<ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 hidden sm:block" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<div className="px-3 py-2">
								<p className="text-sm font-medium">{session?.user?.name}</p>
								<p className="text-xs text-muted-foreground">{session?.user?.email}</p>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => router.push("/profile")}
							>
								<User className="h-4 w-4" />
								Profil
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => router.push("/settings")}
							>
								<Settings className="h-4 w-4" />
								Pengaturan
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => signOut({ callbackUrl: "/login" })}
							>
								<LogOut className="h-4 w-4" />
								Keluar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			<MobileSidebar
				open={mobileMenuOpen}
				onClose={() => setMobileMenuOpen(false)}
			/>
		</>
	);
}
