export function generateCsv(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  const escapeValue = (value: unknown): string => {
    if (value == null) return ""
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.map((c) => escapeValue(c.label)).join(",")
  const rows = data.map((row) => columns.map((c) => escapeValue(row[c.key])).join(","))

  return "\uFEFF" + header + "\r\n" + rows.join("\r\n")
}
