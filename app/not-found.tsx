import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <span className="text-4xl font-bold text-primary">?</span>
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-xl font-semibold mb-2">Halaman Tidak Ditemukan</p>
        <p className="text-sm text-muted-foreground mb-8">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
