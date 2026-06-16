"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/member";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
	});

	async function onSubmit(data: LoginFormValues) {
		setIsLoading(true);

		try {
			const result = await signIn("credentials", {
				username: data.username,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				toast.error("Username atau password salah");
				return;
			}

			toast.success("Login berhasil");
			router.push("/dashboard");
			router.refresh();
		} catch {
			toast.error("Terjadi kesalahan saat login");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
						<Lock className="h-8 w-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold">EVote</h1>
					<p className="text-sm text-muted-foreground mt-2">Suara Anda, Tercatat & Terverifikasi</p>
				</div>

				<Card className="shadow-lg">
					<CardHeader className="text-center">
						<CardTitle>Masuk</CardTitle>
						<CardDescription className="mb-2">Masukkan username/email dan password Anda</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="space-y-4"
						>
							<div className="space-y-3">
								<Label htmlFor="username">Username / Email</Label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="username"
										type="text"
										placeholder="Masukkan username atau email"
										className="pl-9"
										{...register("username")}
									/>
								</div>
								{errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
							</div>

							<div className="space-y-3">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Masukkan password"
										className="pl-9 pr-9"
										{...register("password")}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
							</div>

							<Button
								type="submit"
								className="w-full"
								size="lg"
								disabled={isLoading}
							>
								{isLoading ? "Memproses..." : "Masuk"}
							</Button>
						</form>

						<div className="mt-4 text-center pt-2">
							<button
								type="button"
								className="text-sm text-primary hover:underline cursor-pointer"
								onClick={() => toast.info("Fitur lupa password dalam pengembangan. Hubungi admin.")}
							>
								Lupa password?
							</button>
						</div>

						{/* <div className="mt-6 p-3 rounded-lg bg-muted">
							<p className="text-xs text-muted-foreground font-medium mb-1.5">Akun demo:</p>
							<ul className="text-xs text-muted-foreground space-y-0.5">
								<li>
									<span className="font-mono">superadmin / admin123</span> (Super Admin)
								</li>
								<li>
									<span className="font-mono">panitia / panitia123</span> (Panitia)
								</li>
								<li>
									<span className="font-mono">verifier / verifier123</span> (Verifier)
								</li>
								<li>
									<span className="font-mono">member / member123</span> (Anggota)
								</li>
							</ul>
						</div> */}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
