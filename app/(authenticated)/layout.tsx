"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const { collapsed } = useSidebar();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
		if (status === "authenticated" && session?.user?.mustChangePassword) {
			router.push("/change-password");
		}
	}, [status, session, router]);

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	return (
		<div className="flex min-h-screen">
			<div className="hidden lg:block fixed inset-y-0 left-0 z-50 h-screen">
				<Sidebar />
			</div>
			<div className={cn("flex-1 min-w-0 transition-all duration-300", collapsed ? "lg:ml-16" : "lg:ml-72")}>
				<Topbar />
				<main className="p-4 sm:p-4 lg:p-6">
					<div className="mx-auto max-w-7xl">{children}</div>
				</main>
			</div>
		</div>
	);
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AuthenticatedContent>{children}</AuthenticatedContent>
		</SidebarProvider>
	);
}
