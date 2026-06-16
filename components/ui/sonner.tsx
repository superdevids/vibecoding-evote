"use client";

import { Toaster as SonnerToaster } from "sonner";

function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			toastOptions={{
				style: {
					background: "var(--background)",
					color: "var(--foreground)",
					border: "1px solid var(--border)",
				},
			}}
		/>
	);
}

export { Toaster };
