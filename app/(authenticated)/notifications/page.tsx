"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, CheckCheck, Mail, MailOpen } from "lucide-react";

interface Notification {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	isRead: boolean;
	link: string | null;
	createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
	info: { icon: <Info className="h-5 w-5" />, color: "text-info" },
	success: { icon: <CheckCircle2 className="h-5 w-5" />, color: "text-success" },
	warning: { icon: <AlertTriangle className="h-5 w-5" />, color: "text-warning" },
	error: { icon: <XCircle className="h-5 w-5" />, color: "text-destructive" },
};

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
	const groups: Record<string, Notification[]> = {};
	for (const n of notifications) {
		const date = new Date(n.createdAt).toLocaleDateString("id-ID", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		if (!groups[date]) groups[date] = [];
		groups[date].push(n);
	}
	return groups;
}

function timeAgo(dateStr: string): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 1) return "Baru saja";
	if (diffMins < 60) return `${diffMins} menit lalu`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours} jam lalu`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays} hari lalu`;
	return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

export default function NotificationsPage() {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			return res.json();
		},
		refetchInterval: 30000,
	});

	const notifications: Notification[] = data?.data || [];

	const markAsReadMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			if (!res.ok) throw new Error();
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const markAllAsReadMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAll: true }),
			});
			if (!res.ok) throw new Error();
			return res.json();
		},
		onSuccess: () => {
			toast.success("Semua notifikasi telah dibaca");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: () => {
			toast.error("Gagal menandai notifikasi");
		},
	});

	const unreadCount = notifications.filter((n) => !n.isRead).length;
	const grouped = groupByDate(notifications);

	return (
		<div className="space-y-6 max-w-3xl">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Notifikasi</h1>
					<p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Tidak ada notifikasi baru"}</p>
				</div>
				{unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => markAllAsReadMutation.mutate()}
						disabled={markAllAsReadMutation.isPending}
					>
						<CheckCheck className="h-4 w-4 mr-2" />
						Tandai Semua Dibaca
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton
							key={i}
							className="h-24 rounded-xl"
						/>
					))}
				</div>
			) : notifications.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
						<h3 className="font-medium text-muted-foreground">Belum ada notifikasi</h3>
						<p className="text-sm text-muted-foreground/60 mt-1">Notifikasi akan muncul di sini ketika ada aktivitas baru</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{Object.entries(grouped).map(([date, items]) => (
						<div key={date}>
							<h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
							<div className="space-y-2">
								{items.map((n) => {
									const config = typeConfig[n.type] || typeConfig.info;
									return (
										<Card
											key={n.id}
											className={`transition-colors cursor-pointer hover:bg-accent/50 ${!n.isRead ? "border-primary/20 bg-primary/5" : ""}`}
											onClick={() => {
												if (!n.isRead) markAsReadMutation.mutate(n.id);
												if (n.link) window.open(n.link, "_blank");
											}}
										>
											<CardContent className="p-4">
												<div className="flex items-start gap-3">
													<div className={`mt-0.5 ${config.color}`}>{n.isRead ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : config.icon}</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-start justify-between gap-2">
															<div className="flex items-center gap-2">
																<p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
																{!n.isRead && (
																	<Badge
																		variant="default"
																		className="h-1.5 w-1.5 rounded-full p-0"
																	/>
																)}
															</div>
															<span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
														</div>
														<p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
