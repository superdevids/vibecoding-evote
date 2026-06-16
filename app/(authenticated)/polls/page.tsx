"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { Plus, Search, Filter, Vote } from "lucide-react";

interface Poll {
	id: string;
	title: string;
	type: string;
	status: string;
	startDate: string;
	endDate: string;
	createdAt: string;
	quorumPercentage: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" }> = {
	Draft: { label: "Draft", variant: "secondary" },
	Scheduled: { label: "Terjadwal", variant: "info" },
	Ongoing: { label: "Berlangsung", variant: "success" },
	Closed: { label: "Selesai", variant: "default" },
	Cancelled: { label: "Dibatalkan", variant: "warning" },
};

const typeLabels: Record<string, string> = {
	"single-choice": "Pilihan Tunggal",
	"multiple-choice": "Pilihan Ganda",
	ranking: "Peringkat",
	"yes-no": "Ya/Tidak",
};

export default function PollsPage() {
	const { data: session } = useSession();
	const userRole = session?.user?.roleId;
	const router = useRouter();
	const [polls, setPolls] = useState<Poll[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	const fetchPolls = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ page: String(page), pageSize: "20" });
			if (search) params.set("search", search);
			if (statusFilter) params.set("status", statusFilter);

			const res = await fetch(`/api/polls?${params}`);
			const data = await res.json();
			setPolls(data.data);
			setTotalPages(data.totalPages);
			setTotal(data.total);
		} catch {
			toast.error("Gagal memuat data poll");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPolls();
	}, [page, statusFilter]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Voting / Poll</h1>
					<p className="text-sm text-muted-foreground">{total} total voting</p>
				</div>
				{userRole === "role-super-admin" || userRole === "role-election-committee" ? (
					<Button
						size="sm"
						onClick={() => router.push("/polls/new")}
					>
						<Plus className="h-4 w-4 mr-2" />
						Buat Poll Baru
					</Button>
				) : null}
			</div>

			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Cari polling..."
								className="pl-10"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && fetchPolls()}
							/>
						</div>
						<Select
							options={[
								{ value: "", label: "Semua Status" },
								{ value: "Draft", label: "Draft" },
								{ value: "Scheduled", label: "Terjadwal" },
								{ value: "Ongoing", label: "Berlangsung" },
								{ value: "Closed", label: "Selesai" },
								{ value: "Cancelled", label: "Dibatalkan" },
							]}
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPage(1);
							}}
						/>
					</div>
				</CardHeader>
				<CardContent className="p-0 overflow-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Judul</TableHead>
								<TableHead>Tipe</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Periode</TableHead>
								<TableHead>Kuorum</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										{Array.from({ length: 5 }).map((_, j) => (
											<TableCell key={j}>
												<Skeleton className="h-5 w-full" />
											</TableCell>
										))}
									</TableRow>
								))
							) : polls.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-12 text-muted-foreground"
									>
										<Vote className="h-8 w-8 mx-auto mb-2 opacity-50" />
										Belum ada voting
									</TableCell>
								</TableRow>
							) : (
								polls.map((poll) => {
									const status = statusConfig[poll.status] || statusConfig.Draft;
									return (
										<TableRow
											key={poll.id}
											className="cursor-pointer"
											onClick={() => {
												if (poll.status === "Ongoing") router.push(`/polls/${poll.id}/vote`);
												else if (poll.status === "Closed") router.push(`/polls/${poll.id}/results`);
												else router.push(`/polls/${poll.id}/edit`);
											}}
										>
											<TableCell className="font-medium">{poll.title}</TableCell>
											<TableCell className="text-muted-foreground text-xs">{typeLabels[poll.type] || poll.type}</TableCell>
											<TableCell>
												<Badge variant={status.variant}>{status.label}</Badge>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{new Date(poll.startDate).toLocaleDateString("id-ID")} - {new Date(poll.endDate).toLocaleDateString("id-ID")}
											</TableCell>
											<TableCell>
												<span className="text-sm">{poll.quorumPercentage}%</span>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className="flex items-center justify-between p-4 border-t">
							<p className="text-sm text-muted-foreground">
								Halaman {page} dari {totalPages}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage(page - 1)}
								>
									Sebelumnya
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages}
									onClick={() => setPage(page + 1)}
								>
									Selanjutnya
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
