import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calculatePollResults } from "@/lib/db/helpers/calculateResults"
import { generateCsv } from "@/lib/export/csv"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { Settings } from "@/lib/types"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "export", "reports")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const pollId = searchParams.get("pollId")

  if (!type || !pollId) {
    return NextResponse.json(
      { error: "Missing required query params: type, pollId" },
      { status: 400 }
    )
  }

  try {
    const results = await calculatePollResults(pollId)

    if (type === "csv") {
      return handleCsvExport(results)
    }

    if (type === "pdf") {
      return handlePdfExport(results, pollId)
    }

    return NextResponse.json({ error: `Unsupported export type: ${type}` }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: "Export failed", details: String(error) },
      { status: 500 }
    )
  }
}

async function handleCsvExport(results: Awaited<ReturnType<typeof calculatePollResults>>) {
  const { poll, totalVotes, totalEligible, participationRate, results: optionResults, voteLogSummary } = results

  const data: Record<string, unknown>[] = [
    { label: "Nama Polling", value: poll.title },
    { label: "Total Pemilih Terdaftar", value: totalEligible },
    { label: "Total Suara Masuk", value: totalVotes },
    { label: "Partisipasi", value: `${participationRate.toFixed(2)}%` },
  ]

  const optionRows = optionResults.map((r, i) => ({
    label: `Pilihan ${i + 1}`,
    value: `${r.name} - ${r.votes} suara (${r.percentage.toFixed(2)}%)`,
  }))

  const summaryRows = [
    { label: "Total Entri Log", value: voteLogSummary.total },
    { label: "Hash Awal", value: voteLogSummary.firstHash },
    { label: "Hash Akhir", value: voteLogSummary.lastHash },
  ]

  const allRows = [
    ...data,
    { label: "", value: "" },
    ...optionRows,
    { label: "", value: "" },
    ...summaryRows,
  ]

  const columns = [
    { key: "label", label: "Keterangan" },
    { key: "value", label: "Nilai" },
  ]

  const csv = generateCsv(allRows, columns)

  const filename = `hasil-polling-${poll.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

async function handlePdfExport(
  results: Awaited<ReturnType<typeof calculatePollResults>>,
  pollId: string
) {
  const { poll, totalVotes, totalEligible, participationRate, results: optionResults, voteLogSummary } = results

  const settingsResult = await db.collection("settings").findMany<Settings>()
  const settings = settingsResult.data[0]
  const committeeName = settings?.organizationName || "Panitia Pemilihan"
  const period = settings?.activePeriod || format(new Date(poll.startDate), "yyyy")

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 40

  const drawText = (text: string, opts: { size?: number; bold?: boolean; x?: number } = {}) => {
    const f = opts.bold ? boldFont : font
    const size = opts.size || 10
    const x = opts.x ?? 50
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
    y -= size + 4
  }

  drawText("BERITA ACARA HASIL VOTING", { size: 16, bold: true })
  y -= 8

  drawText(`Nama Polling: ${poll.title}`, { size: 11 })
  drawText(`Periode: ${period}`, { size: 11 })
  drawText(`Tipe: ${poll.type}`, { size: 11 })
  drawText(
    `Periode Pemungutan: ${format(new Date(poll.startDate), "dd MMMM yyyy", { locale: id })} - ${format(new Date(poll.endDate), "dd MMMM yyyy", { locale: id })}`,
    { size: 10 }
  )
  y -= 8

  drawText("DATA PARTISIPASI", { size: 12, bold: true })
  drawText(`Total Pemilih Terdaftar: ${totalEligible}`, { size: 10 })
  drawText(`Total Suara Masuk: ${totalVotes}`, { size: 10 })
  drawText(`Tingkat Partisipasi: ${participationRate.toFixed(2)}%`, { size: 10 })
  y -= 8

  drawText("HASIL PEMUNGUTAN SUARA", { size: 12, bold: true })

  const tableLeft = 50
  const col1 = 30
  const col2 = 200
  const col3 = 100
  const col4 = 80
  const rowH = 16

  page.drawText("No", { x: tableLeft, y, size: 9, font: boldFont, color: rgb(0, 0, 0) })
  page.drawText("Nama Pilihan", { x: tableLeft + col1, y, size: 9, font: boldFont, color: rgb(0, 0, 0) })
  page.drawText("Suara", { x: tableLeft + col1 + col2, y, size: 9, font: boldFont, color: rgb(0, 0, 0) })
  page.drawText("%", { x: tableLeft + col1 + col2 + col3, y, size: 9, font: boldFont, color: rgb(0, 0, 0) })

  const lineY = y - 2
  page.drawLine({
    start: { x: tableLeft, y: lineY },
    end: { x: tableLeft + col1 + col2 + col3 + col4, y: lineY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })

  y -= rowH

  for (let i = 0; i < optionResults.length; i++) {
    const opt = optionResults[i]
    page.drawText(String(i + 1), { x: tableLeft, y, size: 9, font, color: rgb(0, 0, 0) })
    page.drawText(opt.name, { x: tableLeft + col1, y, size: 9, font, color: rgb(0, 0, 0) })
    page.drawText(String(opt.votes), { x: tableLeft + col1 + col2, y, size: 9, font, color: rgb(0, 0, 0) })
    page.drawText(`${opt.percentage.toFixed(2)}%`, { x: tableLeft + col1 + col2 + col3, y, size: 9, font, color: rgb(0, 0, 0) })
    y -= rowH

    if (y < 100) {
      break
    }
  }

  y -= 8

  drawText("RINGKASAN HASH", { size: 12, bold: true })
  drawText(`Total Entri Log: ${voteLogSummary.total}`, { size: 9 })
  drawText(`Hash Awal: ${voteLogSummary.firstHash.slice(0, 40)}...`, { size: 8 })
  drawText(`Hash Akhir: ${voteLogSummary.lastHash.slice(0, 40)}...`, { size: 8 })
  y -= 8

  drawText("TANDA TANGAN DIGITAL", { size: 12, bold: true })
  drawText(`Komite: ${committeeName}`, { size: 10 })
  drawText(`Waktu: ${format(new Date(), "dd MMMM yyyy HH:mm:ss", { locale: id })}`, { size: 10 })
  drawText(`Poll ID: ${pollId}`, { size: 8 })

  const pdfBytes = await pdfDoc.save()

  const filename = `berita-acara-${poll.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
