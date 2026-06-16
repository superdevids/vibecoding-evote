export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export type UserRole = 'super-admin' | 'election-committee' | 'verifier' | 'member'

export interface User extends BaseEntity {
  email: string
  username: string
  passwordHash: string
  roleId: string
  memberId?: string
  mustChangePassword: boolean
  isActive: boolean
  lastLoginAt?: string
}

export interface Role extends BaseEntity {
  name: string
  description: string
  permissions: Record<string, string[]>
}

export interface OrganizationUnit extends BaseEntity {
  name: string
  description?: string
  parentId?: string
  isActive: boolean
}

export type MemberStatus = 'Aktif' | 'Nonaktif' | 'Suspended'
export type VerificationStatus = 'belum' | 'sudah' | 'expired'

export interface Member extends BaseEntity {
  namaLengkap: string
  nomorAnggota: string
  fotoProfil?: string
  email: string
  noHP?: string
  organizationUnitId: string
  jabatan?: string
  status: MemberStatus
  tanggalBergabung: string
  tanggalBerakhir?: string
  verificationStatus: VerificationStatus
  nik?: string
}

export interface MemberDocument extends BaseEntity {
  memberId: string
  jenis: string
  filePath: string
  status: 'belum' | 'sudah' | 'expired'
  keterangan?: string
}

export interface MemberHistory extends BaseEntity {
  memberId: string
  field: string
  oldValue?: string
  newValue: string
  changedBy: string
}

export type PollType = 'single-choice' | 'multiple-choice' | 'ranking' | 'yes-no'
export type PollCategory = 'Pemilihan Ketua' | 'Pengambilan Keputusan' | 'Survei' | 'Lainnya'
export type PollStatus = 'Draft' | 'Scheduled' | 'Ongoing' | 'Closed' | 'Cancelled'
export type VisibilityType = 'public-after-close' | 'committee-only' | 'public-realtime'

export interface Poll extends BaseEntity {
  title: string
  description: string
  type: PollType
  category: PollCategory
  startDate: string
  endDate: string
  status: PollStatus
  visibility: VisibilityType
  quorumPercentage: number
  allowComments: boolean
  isRankingPublic: boolean
  randomizeOptions: boolean
  createdBy: string
}

export interface PollOption extends BaseEntity {
  pollId: string
  name: string
  description?: string
  visiMisi?: string
  foto?: string
  urutan: number
}

export interface PollEligibility extends BaseEntity {
  pollId: string
  type: 'organizationUnit' | 'member' | 'status'
  referenceId: string
}

export interface VoteToken extends BaseEntity {
  token: string
  pollId: string
  memberId: string
  isUsed: boolean
  usedAt?: string
  expiresAt: string
}

export interface Vote extends BaseEntity {
  pollId: string
  voteTokenId: string
  optionIds: string[]
  ranking?: string[]
  hash: string
  receiptHash: string
  timestamp: string
}

export interface VoteLogEntry extends BaseEntity {
  pollId: string
  voteId: string
  hash: string
  previousHash: string
  data: string
  timestamp: string
  chainIndex: number
}

export interface Comment extends BaseEntity {
  pollId: string
  memberId: string
  content: string
  isHidden: boolean
  hiddenReason?: string
  hiddenBy?: string
  parentId?: string
}

export interface Announcement extends BaseEntity {
  title: string
  content: string
  targetOrganizationUnitId?: string
  isPinned: boolean
  readBy: string[]
  createdBy: string
}

export interface CompanyDocument extends BaseEntity {
  title: string
  description?: string
  filePath: string
  category: string
  acknowledgedBy: string[]
  isRequired: boolean
}

export interface ReportExport extends BaseEntity {
  pollId: string
  type: 'berita-acara' | 'rekap-hasil' | 'partisipasi'
  format: 'pdf' | 'csv' | 'xlsx'
  filePath?: string
  generatedBy: string
}

export interface AuditLog extends BaseEntity {
  userId: string
  action: string
  resource: string
  resourceId?: string
  before?: string
  after?: string
  ip?: string
}

export interface Notification extends BaseEntity {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  link?: string
}

export interface Settings extends BaseEntity {
  organizationName: string
  organizationLogo: string
  activePeriod: string
  defaultTimezone: string
  defaultQuorumPercentage: number
  defaultRankingMethod: string
  voteHashSalt: string
  retentionMappingDays: number
  allowPublicResultView: boolean
}

export interface QueryOptions {
  where?: Record<string, unknown>
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  pagination?: { page: number; pageSize: number }
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DataAdapter {
  collection(name: string): DataCollection
}

export interface DataCollection {
  findMany<T>(opts?: QueryOptions): Promise<PaginatedResult<T>>
  findById<T>(id: string): Promise<T | null>
  findOne<T>(where: Record<string, unknown>): Promise<T | null>
  create<T>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T>
  update<T>(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
  count(opts?: { where?: Record<string, unknown> }): Promise<number>
  append<T>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T>
}

export interface PermissionCheck {
  granted: boolean
  role: string | null
  action: string
  resource: string
}
