import crypto from "crypto"

const ALGORITHM = "aes-256-cbc"
const ENCRYPTION_KEY = process.env.VOTE_ENCRYPTION_KEY || crypto.createHash("sha256").update("evote-default-encryption-key-2026").digest("hex").substring(0, 32)
const IV_LENGTH = 16

export function encryptMapping(memberId: string, tokenId: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  const data = JSON.stringify({ memberId, tokenId, ts: Date.now() })
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decryptMapping(encrypted: string): { memberId: string; tokenId: string } | null {
  try {
    const parts = encrypted.split(":")
    if (parts.length !== 2) return null
    const iv = Buffer.from(parts[0], "hex")
    const encryptedText = parts[1]
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}

export function hashMemberToken(memberId: string, pollId: string): string {
  const input = `${memberId}|${pollId}|${ENCRYPTION_KEY}`
  return crypto.createHash("sha256").update(input).digest("hex")
}
