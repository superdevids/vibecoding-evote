# EVote — Suara Anda, Tercatat & Terverifikasi

Sistem voting/pemilihan organisasi berbasis web yang transparan dengan **blockchain-style audit log**, ranked-choice voting, verifikasi integritas, dan manajemen anggota.

## Fitur Utama

- **Pemilihan Transparan** — Setiap suara dicatat dalam rantai hash (blockchain-style audit log) untuk integritas data
- **Ranked-Choice Voting (Borda)** — Mendukung sistem voting peringkat
- **Verifikasi Integritas** — Pemilih dapat memverifikasi bahwa suara mereka tercatat tanpa mengungkap pilihan
- **Vote Receipts** — Setiap pemilih menerima receipt hash untuk verifikasi mandiri
- **Manajemen Anggota** — Dukungan unit organisasi, foto, NIK, status verifikasi
- **Role-Based Access Control** — Super Admin, Election Committee, Verifier, Member
- **Diskusi & Sengketa** — Forum diskusi dan mekanisme sengketa per pemilihan
- **Pengumuman & Dokumen** — Pengumuman terarah per unit organisasi dengan tracking read status
- **Ekspor Laporan** — Excel (XLSX) dan PDF
- **Notifikasi** — Notifikasi per pengguna

## Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Next.js 16** (App Router) | Framework full-stack |
| **TypeScript 5** | Bahasa pemrograman |
| **React 19** | UI Library |
| **Tailwind CSS 4** | Styling |
| **NextAuth.js v5** | Autentikasi (credentials) |
| **Prisma 7** | ORM (MySQL) |
| **TanStack React Query 5** | Data fetching & caching |
| **Zod** | Validasi form & data |
| **Recharts** | Grafik & visualisasi |
| **Lucide React** | Ikon |
| **Radix UI** | Primitive components |

## Database

Mendukung dua mode penyimpanan:

- **JSON Driver** (`DB_DRIVER=json`) — Penyimpanan file JSON lokal (default, tanpa database)
- **MySQL** (`DB_DRIVER=mysql`) — Menggunakan Prisma ORM

## Panduan Memulai

### Prasyarat

- Node.js 18+
- npm / yarn / pnpm / bun

### Instalasi

```bash
# Clone repositori
git clone https://github.com/superdevids/vibecoding-evote.git
cd evoting

# Install dependencies
npm install

# Salin file environment
cp .env.example .env.local

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Seed Database

```bash
npm run seed
```

## Scripts

| Script | Perintah |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `seed` | `tsx scripts/seed.ts` |

## Struktur Direktori

```
src/
  app/               # Halaman (App Router)
    (authenticated)/ # Halaman yang membutuhkan login
    api/             # Route handlers
    login/           # Halaman login
  components/        # Shared components
    charts/          # Grafik
    layout/          # Layout components
    polls/           # Komponen polling
    ui/              # UI primitives
  lib/               # Business logic
    auth/            # NextAuth configuration
    db/              # Database drivers (JSON, Prisma)
    export/          # Export XLSX, PDF
    hooks/           # Custom hooks
    types/           # TypeScript types
    validations/     # Zod schemas
  data/              # JSON file storage (default)
  prisma/            # MySQL Prisma schema
```

## Lingkungan

Salin `.env.example` ke `.env.local` dan sesuaikan:

| Variabel | Deskripsi |
|---|---|
| `AUTH_SECRET` | Secret untuk NextAuth.js |
| `DB_DRIVER` | `json` atau `mysql` |
| `VOTE_ENCRYPTION_KEY` | Kunci enkripsi suara |
| `DATABASE_URL` | URL MySQL (jika DB_DRIVER=mysql) |

## Lisensi

Hak cipta © 2026 — EVote
