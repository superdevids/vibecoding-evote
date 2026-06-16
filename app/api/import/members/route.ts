import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkPermission } from "@/lib/auth/checkPermission"
import { auth } from "@/lib/auth/auth"
import type { Member, Settings } from "@/lib/types"
import * as XLSX from "xlsx"

interface ImportRow {
  namaLengkap?: string
  email?: string
  nik?: string
  noHP?: string
  organizationUnitId?: string
  [key: string]: unknown
}

interface ImportError {
  row: number
  field: string
  message: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return NextResponse.json({ error: "No sheets found in file" }, { status: 400 })
    }

    const sheet = workbook.Sheets[sheetName]
    const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in file" }, { status: 400 })
    }

    const errors: ImportError[] = []
    const validRows: ImportRow[] = []

    const headerKeys = Object.keys(rows[0])

    if (!headerKeys.some((k) => k.toLowerCase() === "namalengkap" || k.toLowerCase() === "nama_lengkap")) {
      return NextResponse.json(
        { error: "Missing required column: namaLengkap" },
        { status: 400 }
      )
    }

    if (!headerKeys.some((k) => k.toLowerCase() === "email")) {
      return NextResponse.json(
        { error: "Missing required column: email" },
        { status: 400 }
      )
    }

    const normalizeKey = (row: ImportRow, key: string): string | undefined => {
      const match = Object.keys(row).find(
        (k) => k.toLowerCase() === key.toLowerCase() || k.toLowerCase() === key.replace(/([A-Z])/g, "_$1").toLowerCase()
      )
      return match ? String(row[match]) : undefined
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const namaLengkap = normalizeKey(row, "namaLengkap")?.trim()
      const email = normalizeKey(row, "email")?.trim().toLowerCase()

      if (!namaLengkap) {
        errors.push({ row: rowNum, field: "namaLengkap", message: "Nama lengkap wajib diisi" })
        continue
      }

      if (!email) {
        errors.push({ row: rowNum, field: "email", message: "Email wajib diisi" })
        continue
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: "email", message: `Format email tidak valid: ${email}` })
        continue
      }

      validRows.push(row)
    }

    const existingEmails = new Set<string>()
    const existingNiks = new Set<string>()

    for (const row of validRows) {
      const email = normalizeKey(row, "email")!.trim().toLowerCase()

      const existingEmail = await db.collection("members").findOne<Member>({ email })
      if (existingEmail) {
        existingEmails.add(email)
      }

      const nik = normalizeKey(row, "nik")?.trim()
      if (nik) {
        const existingNik = await db.collection("members").findOne<Member>({ nik })
        if (existingNik) {
          existingNiks.add(nik)
        }
      }
    }

    const finalErrors: ImportError[] = [...errors]

    const finalRows = validRows.filter((row) => {
      const email = normalizeKey(row, "email")!.trim().toLowerCase()
      if (existingEmails.has(email)) {
        finalErrors.push({
          row: rows.indexOf(row) + 2,
          field: "email",
          message: `Email sudah terdaftar: ${email}`,
        })
        return false
      }

      const nik = normalizeKey(row, "nik")?.trim()
      if (nik && existingNiks.has(nik)) {
        finalErrors.push({
          row: rows.indexOf(row) + 2,
          field: "nik",
          message: `NIK sudah terdaftar: ${nik}`,
        })
        return false
      }

      return true
    })

    const settingsResult = await db.collection("settings").findMany<Settings>()
    const settings = settingsResult.data[0]
    const period = settings?.activePeriod || formatPeriod()

    const existingCount = await db.collection("members").count()
    let importedCount = 0

    for (let j = 0; j < finalRows.length; j++) {
      const row = finalRows[j]
      const nomorAnggota = `MBR-${period}-${String(existingCount + importedCount + 1).padStart(4, "0")}`

      await db.collection("members").create<Member>({
        namaLengkap: normalizeKey(row, "namaLengkap")!.trim(),
        email: normalizeKey(row, "email")!.trim().toLowerCase(),
        nomorAnggota,
        nik: normalizeKey(row, "nik")?.trim(),
        noHP: normalizeKey(row, "noHP")?.trim(),
        organizationUnitId: normalizeKey(row, "organizationUnitId")?.trim() || "",
        status: "Aktif",
        verificationStatus: "belum",
        tanggalBergabung: new Date().toISOString(),
      })

      importedCount++
    }

    return NextResponse.json(
      {
        imported: importedCount,
        errors: finalErrors,
        totalRows: rows.length,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    )
  }
}

function formatPeriod(): string {
  return String(new Date().getFullYear())
}
