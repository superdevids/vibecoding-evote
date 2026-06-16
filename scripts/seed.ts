import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.resolve(process.cwd(), "data");

async function atomicWrite(filePath: string, data: string): Promise<void> {
	const tmpPath = filePath + ".tmp";
	await fs.writeFile(tmpPath, data, "utf-8");
	await fs.rename(tmpPath, filePath);
}

function hashPassword(password: string): string {
	return bcrypt.hashSync(password, 10);
}

function generateHash(data: string, previousHash: string, salt: string): string {
	const input = `${data}|${previousHash}|${salt}`;
	return crypto.createHash("sha256").update(input).digest("hex");
}

function generateReceipt(): string {
	return crypto.randomBytes(16).toString("hex").toUpperCase();
}

function formatDate(date: Date): string {
	return date.toISOString();
}

const now = new Date();
const day = 86400000;

// Organization Units
const orgUnits = [
	{ id: "org-pusat", name: "Pengurus Pusat", description: "Pengurus tingkat pusat", parentId: undefined },
	{ id: "org-jakarta", name: "DPD Jakarta", description: "DPD DKI Jakarta", parentId: "org-pusat" },
	{ id: "org-bandung", name: "DPD Bandung", description: "DPD Kota Bandung", parentId: "org-pusat" },
	{ id: "org-surabaya", name: "DPD Surabaya", description: "DPD Kota Surabaya", parentId: "org-pusat" },
	{ id: "org-yogya", name: "DPD Yogyakarta", description: "DPD DI Yogyakarta", parentId: "org-pusat" },
].map((u) => ({
	...u,
	createdAt: formatDate(new Date(now.getTime() - 90 * day)),
	updatedAt: formatDate(new Date(now.getTime() - 90 * day)),
	isActive: true,
}));

// Members - 30+ members
const memberNames = ["Ahmad Fauzi", "Budi Santoso", "Citra Dewi", "Dian Permata", "Eko Prasetyo", "Fitri Handayani", "Gilang Ramadhan", "Hesti Purnama", "Indra Lesmana", "Joko Susilo", "Kartika Sari", "Lukman Hakim", "Mega Wati", "Nugroho Setiawan", "Oktavia Dewi", "Putra Wijaya", "Qori Aisyah", "Rudi Hartono", "Siti Nurhaliza", "Toni Kusuma", "Umi Kalsum", "Vicky Pratama", "Wulan Sari", "Xaverius Dwi", "Yuni Astuti", "Zainal Abidin", "Agus Wijaya", "Bunga Lestari", "Cahyadi Putra", "Dewi Sartika", "Edi Susanto", "Fajar Nugraha", "Gita Savitri"];

const orgIds = orgUnits.map((u) => u.id);

function generateMember(index: number) {
	const name = memberNames[index];
	const orgId = orgIds[index % orgIds.length];
	const status: ("Aktif" | "Nonaktif" | "Suspended")[] = ["Aktif", "Aktif", "Aktif", "Aktif", "Nonaktif", "Aktif", "Aktif", "Suspended"];
	const statuses: ("belum" | "sudah" | "expired")[] = ["sudah", "sudah", "sudah", "sudah", "belum", "sudah", "sudah", "sudah"];
	return {
		id: uuidv4(),
		namaLengkap: name,
		nomorAnggota: `MBR-2026-${String(index + 1).padStart(4, "0")}`,
		email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
		noHP: `0812${String(10000000 + index).slice(0, 8)}`,
		organizationUnitId: orgId,
		jabatan: ["Anggota", "Koordinator", "Sekretaris", "Bendahara", "Wakil Ketua"][index % 5],
		status: status[index % status.length] as "Aktif" | "Nonaktif" | "Suspended",
		tanggalBergabung: formatDate(new Date(now.getTime() - (60 + index) * day)),
		tanggalBerakhir: index % 7 === 0 ? formatDate(new Date(now.getTime() + 90 * day)) : undefined,
		verificationStatus: statuses[index % statuses.length] as "belum" | "sudah" | "expired",
		nik: `3273${String(100000 + index).slice(0, 6)}${String(index).padStart(4, "0")}`,
		createdAt: formatDate(new Date(now.getTime() - (60 + index) * day)),
		updatedAt: formatDate(new Date(now.getTime() - (60 + index) * day)),
	};
}

const members = Array.from({ length: memberNames.length }, (_, i) => generateMember(i));

// Users - one per role + some members
const roleIds = ["role-super-admin", "role-election-committee", "role-verifier", "role-member"];

const users = [
	{
		id: uuidv4(),
		email: "superadmin@evote.test",
		username: "superadmin",
		passwordHash: hashPassword("admin123"),
		roleId: "role-super-admin",
		memberId: members[0].id,
		mustChangePassword: false,
		isActive: true,
		lastLoginAt: formatDate(new Date(now.getTime() - 1 * day)),
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 1 * day)),
	},
	{
		id: uuidv4(),
		email: "panitia@evote.test",
		username: "panitia",
		passwordHash: hashPassword("panitia123"),
		roleId: "role-election-committee",
		memberId: members[1].id,
		mustChangePassword: false,
		isActive: true,
		lastLoginAt: formatDate(new Date(now.getTime() - 2 * day)),
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 2 * day)),
	},
	{
		id: uuidv4(),
		email: "verifier@evote.test",
		username: "verifier",
		passwordHash: hashPassword("verifier123"),
		roleId: "role-verifier",
		memberId: members[2].id,
		mustChangePassword: false,
		isActive: true,
		lastLoginAt: formatDate(new Date(now.getTime() - 3 * day)),
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 3 * day)),
	},
	{
		id: uuidv4(),
		email: "member@evote.test",
		username: "member",
		passwordHash: hashPassword("member123"),
		roleId: "role-member",
		memberId: members[3].id,
		mustChangePassword: true,
		isActive: true,
		lastLoginAt: undefined,
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 90 * day)),
	},
];

// Add a few more member users
for (let i = 4; i < 10; i++) {
	users.push({
		id: uuidv4(),
		email: `anggota${i}@evote.test`,
		username: `anggota${i}`,
		passwordHash: hashPassword("anggota123"),
		roleId: "role-member",
		memberId: members[i].id,
		mustChangePassword: false,
		isActive: true,
		lastLoginAt: formatDate(new Date(now.getTime() - i * day)),
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - i * day)),
	});
}

// Polls
const poll1Id = uuidv4();
const poll2Id = uuidv4();
const poll3Id = uuidv4();
const poll4Id = uuidv4();

const polls = [
	{
		id: poll1Id,
		title: "Pemilihan Ketua Umum 2026-2028",
		description: "Pemilihan Ketua Umum untuk periode 2026-2028. Setiap anggota berhak memilih satu calon.",
		type: "single-choice" as const,
		category: "Pemilihan Ketua" as const,
		startDate: formatDate(new Date(now.getTime() - 30 * day)),
		endDate: formatDate(new Date(now.getTime() - 15 * day)),
		status: "Closed" as const,
		visibility: "public-after-close" as const,
		quorumPercentage: 50,
		allowComments: true,
		isRankingPublic: true,
		randomizeOptions: false,
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 45 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 15 * day)),
	},
	{
		id: poll2Id,
		title: "Penetapan Anggaran Tahunan 2026",
		description: "Voting untuk menyetujui atau menolak rancangan anggaran tahunan organisasi tahun 2026.",
		type: "yes-no" as const,
		category: "Pengambilan Keputusan" as const,
		startDate: formatDate(new Date(now.getTime() - 5 * day)),
		endDate: formatDate(new Date(now.getTime() + 7 * day)),
		status: "Ongoing" as const,
		visibility: "public-realtime" as const,
		quorumPercentage: 40,
		allowComments: true,
		isRankingPublic: true,
		randomizeOptions: false,
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 15 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 5 * day)),
	},
	{
		id: poll3Id,
		title: "Survei Kepuasan Program Kerja 2025",
		description: "Survei untuk mengukur tingkat kepuasan anggota terhadap program kerja yang telah dijalankan.",
		type: "ranking" as const,
		category: "Survei" as const,
		startDate: formatDate(new Date(now.getTime() + 14 * day)),
		endDate: formatDate(new Date(now.getTime() + 28 * day)),
		status: "Scheduled" as const,
		visibility: "public-after-close" as const,
		quorumPercentage: 30,
		allowComments: false,
		isRankingPublic: false,
		randomizeOptions: true,
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 10 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 10 * day)),
	},
	{
		id: poll4Id,
		title: "Pemilihan Koordinator Divisi",
		description: "Draf pemilihan koordinator divisi untuk periode mendatang. Masih dalam tahap persiapan.",
		type: "single-choice" as const,
		category: "Pemilihan Ketua" as const,
		startDate: formatDate(new Date(now.getTime() + 35 * day)),
		endDate: formatDate(new Date(now.getTime() + 42 * day)),
		status: "Draft" as const,
		visibility: "committee-only" as const,
		quorumPercentage: 50,
		allowComments: true,
		isRankingPublic: true,
		randomizeOptions: false,
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 2 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 2 * day)),
	},
];

// Poll Options
const pollOptions = [
	{ id: uuidv4(), pollId: poll1Id, name: "Ahmad Fauzi", description: "Calon nomor 1", visiMisi: "Memajukan organisasi dengan program kerja inovatif", urutan: 1 },
	{ id: uuidv4(), pollId: poll1Id, name: "Budi Santoso", description: "Calon nomor 2", visiMisi: "Penguatan organisasi berbasis anggota", urutan: 2 },
	{ id: uuidv4(), pollId: poll1Id, name: "Citra Dewi", description: "Calon nomor 3", visiMisi: "Transparansi dan profesionalisme organisasi", urutan: 3 },
	{ id: uuidv4(), pollId: poll1Id, name: "Dian Permata", description: "Calon nomor 4", visiMisi: "Digitalisasi organisasi untuk era modern", urutan: 4 },
	{ id: uuidv4(), pollId: poll2Id, name: "Setuju", description: "Menyetujui rancangan anggaran", urutan: 1 },
	{ id: uuidv4(), pollId: poll2Id, name: "Tidak Setuju", description: "Menolak rancangan anggaran", urutan: 2 },
	{ id: uuidv4(), pollId: poll2Id, name: "Abstain", description: "Tidak memberikan suara", urutan: 3 },
	{ id: uuidv4(), pollId: poll3Id, name: "Program Kaderisasi", description: "Program pembinaan kader", urutan: 1 },
	{ id: uuidv4(), pollId: poll3Id, name: "Program Sosial", description: "Program pengabdian masyarakat", urutan: 2 },
	{ id: uuidv4(), pollId: poll3Id, name: "Program Pendidikan", description: "Program pelatihan dan workshop", urutan: 3 },
	{ id: uuidv4(), pollId: poll4Id, name: "Koordinator A", description: "Kandidat koordinator divisi A", urutan: 1 },
	{ id: uuidv4(), pollId: poll4Id, name: "Koordinator B", description: "Kandidat koordinator divisi B", urutan: 2 },
].map((opt) => ({
	...opt,
	createdAt: formatDate(new Date(now.getTime() - 45 * day)),
	updatedAt: formatDate(new Date(now.getTime() - 45 * day)),
}));

// Poll Eligibility - all active members eligible for poll 1 and 2
const activeMembers = members.filter((m) => m.status === "Aktif");
const pollEligibility: Array<{
	id: string;
	pollId: string;
	type: "member";
	referenceId: string;
	createdAt: string;
	updatedAt: string;
}> = [];

for (const member of activeMembers) {
	pollEligibility.push({
		id: uuidv4(),
		pollId: poll1Id,
		type: "member",
		referenceId: member.id,
		createdAt: formatDate(new Date(now.getTime() - 40 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 40 * day)),
	});
	pollEligibility.push({
		id: uuidv4(),
		pollId: poll2Id,
		type: "member",
		referenceId: member.id,
		createdAt: formatDate(new Date(now.getTime() - 12 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 12 * day)),
	});
}

// For poll 3, only half the active members
const halfActive = activeMembers.slice(0, Math.floor(activeMembers.length / 2));
for (const member of halfActive) {
	pollEligibility.push({
		id: uuidv4(),
		pollId: poll3Id,
		type: "member",
		referenceId: member.id,
		createdAt: formatDate(new Date(now.getTime() - 8 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 8 * day)),
	});
}

// Votes for poll 1 (closed)
const poll1Options = pollOptions.filter((o) => o.pollId === poll1Id);
const voteTokens: Array<{
	id: string;
	token: string;
	pollId: string;
	memberId: string;
	isUsed: boolean;
	usedAt?: string;
	expiresAt: string;
	createdAt: string;
	updatedAt: string;
}> = [];
const votes: Array<{
	id: string;
	pollId: string;
	voteTokenId: string;
	optionIds: string[];
	hash: string;
	receiptHash: string;
	timestamp: string;
	createdAt: string;
	updatedAt: string;
}> = [];
const voteLog: Array<{
	id: string;
	pollId: string;
	voteId: string;
	hash: string;
	previousHash: string;
	data: string;
	timestamp: string;
	chainIndex: number;
	createdAt: string;
	updatedAt: string;
}> = [];

const salt = "evote-salt-2026";
let previousHash = "genesis";
let chainIndex = 0;
const voteCounts: Record<string, number> = {};

// Distribute votes: weighted towards option 0 (Ahmad Fauzi) for a realistic result
const weights = [0.45, 0.3, 0.15, 0.1];

for (let i = 0; i < activeMembers.length; i++) {
	const member = activeMembers[i];
	const tokenId = uuidv4();
	const token = `VT-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
	const voteTokenEntry = {
		id: tokenId,
		token,
		pollId: poll1Id,
		memberId: member.id,
		isUsed: true,
		usedAt: formatDate(new Date(now.getTime() - (20 + i) * day + i * 3600000)),
		expiresAt: formatDate(new Date(now.getTime() - 15 * day)),
		createdAt: formatDate(new Date(now.getTime() - (20 + i) * day)),
		updatedAt: formatDate(new Date(now.getTime() - (20 + i) * day)),
	};
	voteTokens.push(voteTokenEntry);

	// Determine vote choice based on weights
	const rand = Math.random();
	let cumWeight = 0;
	let chosenIdx = 0;
	for (let w = 0; w < weights.length; w++) {
		cumWeight += weights[w];
		if (rand <= cumWeight) {
			chosenIdx = w;
			break;
		}
	}
	const chosenOption = poll1Options[chosenIdx % poll1Options.length];
	voteCounts[chosenOption.id] = (voteCounts[chosenOption.id] || 0) + 1;

	const voteId = uuidv4();
	const voteTimestamp = formatDate(new Date(now.getTime() - (20 + i) * day + i * 3600000));
	const voteData = JSON.stringify({
		pollId: poll1Id,
		optionIds: [chosenOption.id],
		voteTokenId: tokenId,
		timestamp: voteTimestamp,
	});

	const hashInput = `${voteData}|${previousHash}|${salt}`;
	const hash = crypto.createHash("sha256").update(hashInput).digest("hex");

	const voteEntry = {
		id: voteId,
		pollId: poll1Id,
		voteTokenId: tokenId,
		optionIds: [chosenOption.id],
		hash,
		receiptHash: generateReceipt(),
		timestamp: voteTimestamp,
		createdAt: voteTimestamp,
		updatedAt: voteTimestamp,
	};
	votes.push(voteEntry);

	const logEntry = {
		id: uuidv4(),
		pollId: poll1Id,
		voteId,
		hash,
		previousHash,
		data: voteData,
		timestamp: voteTimestamp,
		chainIndex,
		createdAt: voteTimestamp,
		updatedAt: voteTimestamp,
	};
	voteLog.push(logEntry);
	previousHash = hash;
	chainIndex++;
}

// Also add some votes for poll 2 (ongoing - partial)
let previousHash2 = "genesis";
let chainIndex2 = 0;
const partialVoters = activeMembers.slice(0, Math.floor(activeMembers.length * 0.6));

for (let i = 0; i < partialVoters.length; i++) {
	const member = partialVoters[i];
	const tokenId = uuidv4();
	const token = `VT-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
	const voteTokenEntry = {
		id: tokenId,
		token,
		pollId: poll2Id,
		memberId: member.id,
		isUsed: true,
		usedAt: formatDate(new Date(now.getTime() - (3 + i) * day + i * 3600000)),
		expiresAt: formatDate(new Date(now.getTime() + 7 * day)),
		createdAt: formatDate(new Date(now.getTime() - (3 + i) * day)),
		updatedAt: formatDate(new Date(now.getTime() - (3 + i) * day)),
	};
	voteTokens.push(voteTokenEntry);

	const poll2Options = pollOptions.filter((o) => o.pollId === poll2Id);
	const chosenOption = poll2Options[Math.floor(Math.random() * poll2Options.length)];
	const voteId = uuidv4();
	const voteTimestamp = formatDate(new Date(now.getTime() - (3 + i) * day + i * 3600000));
	const voteData = JSON.stringify({
		pollId: poll2Id,
		optionIds: [chosenOption.id],
		voteTokenId: tokenId,
		timestamp: voteTimestamp,
	});

	const hashInput = `${voteData}|${previousHash2}|${salt}`;
	const hash = crypto.createHash("sha256").update(hashInput).digest("hex");

	const voteEntry = {
		id: voteId,
		pollId: poll2Id,
		voteTokenId: tokenId,
		optionIds: [chosenOption.id],
		hash,
		receiptHash: generateReceipt(),
		timestamp: voteTimestamp,
		createdAt: voteTimestamp,
		updatedAt: voteTimestamp,
	};
	votes.push(voteEntry);

	const logEntry = {
		id: uuidv4(),
		pollId: poll2Id,
		voteId,
		hash,
		previousHash: previousHash2,
		data: voteData,
		timestamp: voteTimestamp,
		chainIndex: chainIndex2,
		createdAt: voteTimestamp,
		updatedAt: voteTimestamp,
	};
	voteLog.push(logEntry);
	previousHash2 = hash;
	chainIndex2++;
}

// Announcements
const announcements = [
	{
		id: uuidv4(),
		title: "Pembukaan Masa Voting Pemilihan Ketua Umum 2026-2028",
		content: "Yth. Seluruh Anggota,\n\nDengan ini diumumkan bahwa masa voting Pemilihan Ketua Umum periode 2026-2028 telah dibuka. Silakan login ke aplikasi EVote untuk memberikan suara Anda.\n\nMasa voting: 15 Jan 2026 - 30 Jan 2026.\n\nTerima kasih atas partisipasi Anda.",
		targetOrganizationUnitId: undefined,
		isPinned: true,
		readBy: [],
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 30 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 30 * day)),
	},
	{
		id: uuidv4(),
		title: "Hasil Pemilihan Ketua Umum 2026-2028",
		content: "Yth. Seluruh Anggota,\n\nHasil Pemilihan Ketua Umum periode 2026-2028 telah dirilis. Silakan lihat halaman hasil voting untuk detail lengkap.\n\nBerita acara hasil voting dapat diunduh dalam format PDF.\n\nTerima kasih.",
		targetOrganizationUnitId: undefined,
		isPinned: true,
		readBy: [],
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 14 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 14 * day)),
	},
	{
		id: uuidv4(),
		title: "Pengumuman Rapat Evaluasi",
		content: "Yth. Anggota DPD Jakarta,\n\nRapat evaluasi program kerja akan dilaksanakan pada:\nHari/Tanggal: Sabtu, 1 Feb 2026\nWaktu: 10:00 WIB\nTempat: Ruang Rapat Utama\n\nMohon kehadiran tepat waktu.",
		targetOrganizationUnitId: "org-jakarta",
		isPinned: false,
		readBy: [],
		createdBy: users[1].id,
		createdAt: formatDate(new Date(now.getTime() - 7 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 7 * day)),
	},
];

// Company Documents
const companyDocuments = [
	{
		id: uuidv4(),
		title: "AD/ART Organisasi",
		description: "Anggaran Dasar dan Anggaran Rumah Tangga Organisasi",
		filePath: "/uploads/ad-art-2026.pdf",
		category: "Dokumen Hukum",
		acknowledgedBy: [],
		isRequired: true,
		createdAt: formatDate(new Date(now.getTime() - 90 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 90 * day)),
	},
	{
		id: uuidv4(),
		title: "Tata Tertib Pemilihan",
		description: "Peraturan dan tata cara pemilihan ketua dan pengurus",
		filePath: "/uploads/tata-tertib-pemilihan.pdf",
		category: "Dokumen Pemilihan",
		acknowledgedBy: [],
		isRequired: true,
		createdAt: formatDate(new Date(now.getTime() - 60 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 60 * day)),
	},
	{
		id: uuidv4(),
		title: "SK Panitia Pemilihan 2026",
		description: "Surat Keputusan pembentukan panitia pemilihan periode 2026",
		filePath: "/uploads/sk-panitia-2026.pdf",
		category: "Dokumen Pemilihan",
		acknowledgedBy: [],
		isRequired: false,
		createdAt: formatDate(new Date(now.getTime() - 45 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 45 * day)),
	},
];

// Audit Logs
const auditLogs = [
	{
		id: uuidv4(),
		userId: users[1].id,
		action: "CREATE",
		resource: "polls",
		resourceId: poll1Id,
		before: undefined,
		after: JSON.stringify({ title: "Pemilihan Ketua Umum 2026-2028" }),
		ip: "127.0.0.1",
		createdAt: formatDate(new Date(now.getTime() - 45 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 45 * day)),
	},
	{
		id: uuidv4(),
		userId: users[1].id,
		action: "PUBLISH",
		resource: "polls",
		resourceId: poll1Id,
		before: JSON.stringify({ status: "Draft" }),
		after: JSON.stringify({ status: "Scheduled" }),
		ip: "127.0.0.1",
		createdAt: formatDate(new Date(now.getTime() - 40 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 40 * day)),
	},
	{
		id: uuidv4(),
		userId: users[1].id,
		action: "CLOSE",
		resource: "polls",
		resourceId: poll1Id,
		before: JSON.stringify({ status: "Ongoing" }),
		after: JSON.stringify({ status: "Closed" }),
		ip: "127.0.0.1",
		createdAt: formatDate(new Date(now.getTime() - 15 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 15 * day)),
	},
	{
		id: uuidv4(),
		userId: users[0].id,
		action: "LOGIN",
		resource: "auth",
		resourceId: users[0].id,
		before: undefined,
		after: undefined,
		ip: "127.0.0.1",
		createdAt: formatDate(new Date(now.getTime() - 1 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 1 * day)),
	},
];

// Notifications
const notifications = [
	{
		id: uuidv4(),
		userId: members[0].id,
		title: "Voting Telah Dimulai",
		message: "Pemilihan Ketua Umum 2026-2028 telah dimulai. Segera berikan suara Anda!",
		type: "info",
		isRead: true,
		link: "/polls/" + poll1Id,
		createdAt: formatDate(new Date(now.getTime() - 30 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 30 * day)),
	},
	{
		id: uuidv4(),
		userId: members[0].id,
		title: "Hasil Voting Telah Dirilis",
		message: "Hasil Pemilihan Ketua Umum telah dirilis. Klik untuk melihat hasil.",
		type: "success",
		isRead: false,
		link: "/polls/" + poll1Id + "/results",
		createdAt: formatDate(new Date(now.getTime() - 14 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 14 * day)),
	},
	{
		id: uuidv4(),
		userId: members[4].id,
		title: "Pengumuman Baru",
		message: "Pengumuman mengenai rapat evaluasi telah dipublikasikan.",
		type: "info",
		isRead: false,
		link: "/announcements",
		createdAt: formatDate(new Date(now.getTime() - 7 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 7 * day)),
	},
	{
		id: uuidv4(),
		userId: members[1].id,
		title: "Anggota Baru Mendaftar",
		message: "Terdapat anggota baru yang perlu diverifikasi.",
		type: "warning",
		isRead: false,
		link: "/members",
		createdAt: formatDate(new Date(now.getTime() - 3 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 3 * day)),
	},
];

// Comments for poll 1
const comments = [
	{
		id: uuidv4(),
		pollId: poll1Id,
		memberId: members[0].id,
		content: "Semoga pemilihan berjalan lancar dan menghasilkan pemimpin terbaik!",
		isHidden: false,
		parentId: undefined,
		createdAt: formatDate(new Date(now.getTime() - 28 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 28 * day)),
	},
	{
		id: uuidv4(),
		pollId: poll1Id,
		memberId: members[5].id,
		content: "Saya mendukung calon nomor 2 karena program kerjanya yang jelas.",
		isHidden: false,
		parentId: undefined,
		createdAt: formatDate(new Date(now.getTime() - 25 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 25 * day)),
	},
	{
		id: uuidv4(),
		pollId: poll1Id,
		memberId: members[10].id,
		content: "Mohon pastikan data pemilih sudah sesuai.",
		isHidden: false,
		parentId: undefined,
		createdAt: formatDate(new Date(now.getTime() - 22 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 22 * day)),
	},
	{
		id: uuidv4(),
		pollId: poll1Id,
		memberId: members[15].id,
		content: "Komentar yang tidak pantas (telah dihapus)",
		isHidden: true,
		hiddenReason: "Mengandung ujaran kebencian",
		hiddenBy: users[1].id,
		parentId: undefined,
		createdAt: formatDate(new Date(now.getTime() - 20 * day)),
		updatedAt: formatDate(new Date(now.getTime() - 18 * day)),
	},
];

async function main() {
	console.log("Seeding database...");

	const files = {
		"users.json": users,
		"organizationUnits.json": orgUnits,
		"members.json": members,
		"polls.json": polls,
		"pollOptions.json": pollOptions.map((o) => ({ ...o, createdAt: o.createdAt, updatedAt: o.updatedAt })),
		"pollEligibility.json": pollEligibility,
		"votes.json": votes,
		"voteLog.json": voteLog,
		"voteTokens.json": voteTokens,
		"comments.json": comments,
		"announcements.json": announcements,
		"companyDocuments.json": companyDocuments,
		"auditLogs.json": auditLogs,
		"notifications.json": notifications,
		"memberDocuments.json": [],
		"memberHistory.json": [],
		"reportExports.json": [],
	};

	for (const [filename, data] of Object.entries(files)) {
		const filePath = path.join(DATA_DIR, filename);
		await atomicWrite(filePath, JSON.stringify(data, null, 2));
		console.log(`  ✓ ${filename} (${Array.isArray(data) ? data.length : 1} records)`);
	}

	console.log("\nSeed complete!");
	console.log("\nTest Accounts:");
	console.log("  Super Admin:    superadmin / admin123");
	console.log("  Panitia:        panitia / panitia123");
	console.log("  Verifier:       verifier / verifier123");
	console.log("  Member:         member / member123");
	console.log("\nMember users:");
	for (let i = 4; i < 10; i++) {
		console.log(`  Anggota ${i}:     anggota${i} / anggota123`);
	}
}

main().catch(console.error);
