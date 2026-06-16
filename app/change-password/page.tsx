"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ShieldAlert } from "lucide-react";

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
		newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
		confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Password baru tidak cocok",
		path: ["confirmPassword"],
	});

type ChangePasswordData = z.input<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
	const { data: session, status, update } = useSession();
	const router = useRouter();
	const [saving, setSaving] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ChangePasswordData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
		if (status === "authenticated" && !session?.user?.mustChangePassword) {
			router.push("/dashboard");
		}
	}, [status, session, router]);

	const onSubmit = async (data: ChangePasswordData) => {
		setSaving(true);
		try {
			const res = await fetch("/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: data.currentPassword,
					newPassword: data.newPassword,
				}),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Gagal mengubah password");
			}
			await update({});
			toast.success("Password berhasil diubah. Mengarahkan ke dashboard...");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Gagal mengubah password");
		} finally {
			setSaving(false);
		}
	};

	if (status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Lock className="h-6 w-6 text-primary" />
					</div>
					<CardTitle>Ubah Password Wajib</CardTitle>
					<CardDescription>Ini adalah pertama kali Anda masuk. Harap ubah password Anda sebelum melanjutkan.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="space-y-3">
							<Label htmlFor="currentPassword">Password Saat Ini</Label>
							<Input
								id="currentPassword"
								type="password"
								{...register("currentPassword")}
							/>
							{errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
						</div>
						<div className="space-y-3">
							<Label htmlFor="newPassword">Password Baru</Label>
							<Input
								id="newPassword"
								type="password"
								{...register("newPassword")}
							/>
							{errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
						</div>
						<div className="space-y-3">
							<Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
							<Input
								id="confirmPassword"
								type="password"
								{...register("confirmPassword")}
							/>
							{errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={saving}
						>
							<ShieldAlert className="h-4 w-4 mr-2" />
							{saving ? "Menyimpan..." : "Ubah Password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
