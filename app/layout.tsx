import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "EVote - Suara Anda, Tercatat & Terverifikasi",
	description: "Sistem voting/polling transparan untuk pengambilan keputusan organisasi",
	icons: {
		icon: "/icon.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="id"
			suppressHydrationWarning
			className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
		>
			<body className="min-h-screen bg-background font-sans antialiased">
				<Providers>
					{children}
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
