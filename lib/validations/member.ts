import { z } from "zod"

export const memberSchema = z.object({
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  noHP: z.string().optional(),
  organizationUnitId: z.string().min(1, "Pilih unit organisasi"),
  jabatan: z.string().optional(),
  nik: z.string().optional(),
  status: z.enum(["Aktif", "Nonaktif", "Suspended"]).default("Aktif"),
})

export type MemberFormValues = z.infer<typeof memberSchema>

export const pollSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().optional(),
  type: z.enum(["single-choice", "multiple-choice", "ranking", "yes-no"]),
  category: z.string().min(1, "Pilih kategori"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  quorumPercentage: z.number().min(1).max(100).default(50),
  visibility: z.enum(["public-after-close", "public-realtime", "committee-only"]),
  allowComments: z.boolean().default(true),
  randomizeOptions: z.boolean().default(false),
  isRankingPublic: z.boolean().default(true),
})

export type PollFormValues = z.infer<typeof pollSchema>

export const loginSchema = z.object({
  username: z.string().min(1, "Username/email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const userSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  roleId: z.string().min(1, "Role wajib dipilih"),
  memberId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type UserFormValues = z.infer<typeof userSchema>
