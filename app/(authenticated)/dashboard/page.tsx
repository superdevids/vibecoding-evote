"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VoteBarChart } from "@/components/charts/vote-bar-chart";
import { Vote, Users, BarChart3, Clock, Shield, Activity, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PollResult {
	poll: {
		id: string;
		title: string;
		type: string;
		quorumPercentage: number;
		startDate: string;
		endDate: string;
	};
	totalVotes: number;
	totalEligible: number;
	participationRate: number;
	quorumMet: boolean;
	results: { optionId: string; name: string; votes: number; percentage: number; rank: number }[];
	winner?: string;
}

interface ResultsResponse {
	data: PollResult[];
}

export default function DashboardPage() {
	const { data: session, status } = useSession();

	const { data: resultsData, isLoading: resultsLoading } = useQuery<ResultsResponse>({
		queryKey: ["dashboard-results"],
		queryFn: async () => {
			const res = await fetch("/api/results");
			if (!res.ok) throw new Error("Failed to fetch results");
			return res.json();
		},
	});

	const { data: membersData } = useQuery({
		queryKey: ["dashboard-members"],
		queryFn: async () => {
			const res = await fetch("/api/members");
			if (!res.ok) throw new Error("Failed to fetch members");
			return res.json();
		},
	});

	const firstPoll = resultsData?.data?.[0];

	if (status === "loading") {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton
							key={i}
							className="h-28 rounded-xl"
						/>
					))}
				</div>
				<Skeleton className="h-72 rounded-xl" />
			</div>
		);
	}

	const role = session?.user?.roleId;

	return (
		<div className="space-y-6 px-0">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Selamat Datang, {session?.user?.name || "User"}</h1>
				<p className="text-sm text-muted-foreground">
					{role === "super-admin" && "Panel administrasi sistem EVote"}
					{role === "election-committee" && "Panel manajemen pemilihan dan voting"}
					{role === "verifier" && "Panel verifikasi integritas hasil voting"}
					{role === "member" && "Panel anggota - voting dan partisipasi"}
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="cursor-pointer hover:shadow-md transition-shadow">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Vote className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Total Poll</p>
							<p className="text-2xl font-bold">{resultsData?.data?.length ?? "..."}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:shadow-md transition-shadow">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
							<Activity className="h-5 w-5 text-success" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Sedang Berlangsung</p>
							<p className="text-2xl font-bold">{resultsData?.data?.filter((r) => new Date(r.poll.endDate) > new Date() && new Date(r.poll.startDate) <= new Date()).length ?? "..."}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:shadow-md transition-shadow">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
							<Users className="h-5 w-5 text-info" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Total Anggota</p>
							<p className="text-2xl font-bold">{membersData?.data?.length ?? "..."}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="cursor-pointer hover:shadow-md transition-shadow">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
							<CheckCircle2 className="h-5 w-5 text-warning" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Partisipasi Rata-rata</p>
							<p className="text-2xl font-bold">{resultsData?.data?.length ? `${(resultsData.data.reduce((sum, r) => sum + r.participationRate, 0) / resultsData.data.length).toFixed(0)}%` : "..."}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Poll Terbaru */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Poll Terbaru</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{resultsData?.data?.slice(0, 3).map((r) => {
							const now = new Date();
							const start = new Date(r.poll.startDate);
							const end = new Date(r.poll.endDate);
							const isOngoing = start <= now && end > now;
							const isPast = end <= now;
							const badge = isOngoing ? "info" : isPast ? "success" : ("warning" as const);
							const label = isOngoing ? "Berlangsung" : isPast ? "Selesai" : "Akan Datang";
							return (
								<div
									key={r.poll.id}
									className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
								>
									<div>
										<Link
											href="/polls"
											className="font-medium text-sm hover:underline cursor-pointer"
										>
											{r.poll.title}
										</Link>
										<div className="flex items-center gap-2 mt-1">
											<Badge variant={badge}>{label}</Badge>
											<span className="text-xs text-muted-foreground">{r.participationRate.toFixed(0)}% partisipasi</span>
										</div>
									</div>
									{isOngoing ? <Clock className="h-4 w-4 text-muted-foreground" /> : <BarChart3 className="h-4 w-4 text-muted-foreground" />}
								</div>
							);
						})}
					</CardContent>
				</Card>

				{/* Aktivitas Terbaru */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{resultsData?.data?.slice(0, 3).map((r) => {
							const now = new Date();
							const end = new Date(r.poll.endDate);
							const isPast = end <= now;
							return (
								<div
									key={r.poll.id}
									className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
								>
									<div className={"flex h-8 w-8 items-center justify-center rounded-full " + (isPast ? "bg-primary/10" : "bg-success/10")}>{isPast ? <Shield className="h-4 w-4 text-primary" /> : <TrendingUp className="h-4 w-4 text-success" />}</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium">{isPast ? "Poll ditutup" : "Hasil Voting Dirilis"}</p>
										<p className="text-xs text-muted-foreground">{isPast ? `${r.poll.title} telah ditutup` : `Hasil ${r.poll.title} telah dipublikasikan`}</p>
										<p className="text-xs text-muted-foreground mt-1">{r.totalVotes} suara masuk</p>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			{/* Results Chart */}
			{resultsLoading ? (
				<Skeleton className="h-72 rounded-xl" />
			) : firstPoll ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{firstPoll.poll.title}</CardTitle>
						<p className="text-sm text-muted-foreground">
							Total suara: {firstPoll.totalVotes} dari {firstPoll.totalEligible} pemilih
						</p>
					</CardHeader>
					<CardContent>
						<VoteBarChart data={firstPoll.results} />
						{firstPoll.winner && (
							<div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20 text-center">
								<CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
								<p className="text-sm text-muted-foreground">Pemenang</p>
								<p className="text-lg font-bold text-success">{firstPoll.winner}</p>
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Hasil Polling</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground text-center py-8">Belum ada hasil polling yang tersedia</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
