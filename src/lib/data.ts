// SportCraft Workshop — seed data for the Phase 1 dashboard.
// Mirrors docs/design-handoff/prototype/app/data.js. Replaced by real Postgres
// queries (see db/schema.ts) once the data layer is wired up in a later phase.

export interface MonthlyRow {
  m: string;
  rev: number;
  cogs: number;
  jobs: number;
}

export interface CategoryRow {
  label: string;
  value: number;
  tone: string;
}

export interface TopStringRow {
  label: string;
  metres: number;
  family: string;
  margin: number;
}

export interface TopProductRow {
  label: string;
  qty: number;
  rev: number;
}

export type JobStatus = "Received" | "Waiting" | "In progress" | "Completed" | "Collected";

export interface JobRow {
  id: string;
  customer: string;
  racket: string;
  rid: string;
  string: string;
  family: string;
  tension: string;
  due: string;
  status: JobStatus;
  tone: "brand" | "neutral";
  price: number;
  paid: boolean;
}

export interface ReadyRow {
  id: string;
  customer: string;
  racket: string;
  since: string;
  price: number;
  paid: boolean;
}

export interface LowStockRow {
  name: string;
  detail: string;
  left: number;
  of: number;
  unit: string;
  threshold: number;
  family: string | null;
}

export interface SaleRow {
  id: string;
  customer: string;
  items: string;
  total: number;
  method: string;
  when: string;
}

const monthly: MonthlyRow[] = [
  { m: "Oct 25", rev: 4180, cogs: 1390, jobs: 78 },
  { m: "Nov 25", rev: 4620, cogs: 1510, jobs: 86 },
  { m: "Dec 25", rev: 5940, cogs: 2080, jobs: 104 },
  { m: "Jan 26", rev: 5210, cogs: 1720, jobs: 94 },
  { m: "Feb 26", rev: 4870, cogs: 1610, jobs: 88 },
  { m: "Mar 26", rev: 6310, cogs: 2240, jobs: 112 },
  { m: "Apr 26", rev: 5780, cogs: 1930, jobs: 101 },
  { m: "May 26", rev: 6040, cogs: 2010, jobs: 107 },
  { m: "Jun 26", rev: 7120, cogs: 2560, jobs: 124 },
  { m: "Jul 26", rev: 6480, cogs: 2190, jobs: 113 },
  { m: "Aug 26", rev: 6890, cogs: 2350, jobs: 118 },
  { m: "Sep 26", rev: 5240, cogs: 1780, jobs: 89 },
];

const monthTotals = { rev: 5240, cogs: 1780, exp: 1180, jobs: 89 };
const ytdTotals = { rev: 49_440, cogs: 16_780, exp: 10_940 };

export const DATA = {
  business: { name: "SportCraft", currency: "SGD", today: "Tue 22 Sep 2026" },

  monthly,

  today: { revenue: 284.0, jobs: 5, products: 7, dueToday: 4, benchLoad: 12, benchCapacity: 18 },
  unbilled: 2,

  month: {
    ...monthTotals,
    gross: monthTotals.rev - monthTotals.cogs,
    net: monthTotals.rev - monthTotals.cogs - monthTotals.exp,
    avgJob: monthTotals.rev / monthTotals.jobs,
  },
  ytd: {
    ...ytdTotals,
    gross: ytdTotals.rev - ytdTotals.cogs,
    net: ytdTotals.rev - ytdTotals.cogs - ytdTotals.exp,
  },

  categories: [
    { label: "Stringing", value: 31_420, tone: "var(--court-600)" },
    { label: "String sales", value: 8_960, tone: "var(--court-400)" },
    { label: "Rackets & paddles", value: 5_310, tone: "var(--clay-500)" },
    { label: "Grips & accessories", value: 2_740, tone: "var(--court-200)" },
    { label: "Customisation", value: 1_010, tone: "var(--ink-300)" },
  ] as CategoryRow[],

  topStrings: [
    { label: "Solinco Hyper-G 1.25", metres: 412, family: "var(--string-poly)", margin: 74 },
    { label: "Yonex BG80 Power", metres: 268, family: "var(--string-multi)", margin: 71 },
    { label: "Luxilon ALU Power 125", metres: 231, family: "var(--string-poly)", margin: 66 },
    { label: "Babolat RPM Blast 17", metres: 187, family: "var(--string-poly)", margin: 69 },
    { label: "Wilson NXT 16", metres: 96, family: "var(--string-multi)", margin: 58 },
  ] as TopStringRow[],

  topProducts: [
    { label: "Yonex Super Grap overgrip", qty: 143, rev: 572 },
    { label: "Hyper-G 1.25 set", qty: 61, rev: 1098 },
    { label: "Wilson Pro Overgrip 3-pack", qty: 38, rev: 418 },
    { label: "Vibration dampener", qty: 34, rev: 170 },
    { label: "Yonex EZONE 100 (2025)", qty: 4, rev: 1436 },
  ] as TopProductRow[],

  jobs: [
    { id: "SC-1042", customer: "Marta Ellis", racket: "Wilson Blade 98 v9", rid: "R-0417", string: "Luxilon ALU Power 125", family: "var(--string-poly)", tension: "24 / 23 kg", due: "Today 16:00", status: "In progress", tone: "brand", price: 42.0, paid: false },
    { id: "SC-1041", customer: "Tom Iredale", racket: "Babolat Pure Aero 98", rid: "R-0402", string: "RPM Blast 17", family: "var(--string-poly)", tension: "25 kg", due: "Today 18:00", status: "In progress", tone: "brand", price: 38.0, paid: false },
    { id: "SC-1040", customer: "Jo Kerrigan", racket: "Head Speed MP", rid: "R-0388", string: "Velocity / 4G hybrid", family: "var(--string-hybrid)", tension: "23 / 22 kg", due: "Tomorrow 10:00", status: "Waiting", tone: "neutral", price: 52.0, paid: false },
    { id: "SC-1039", customer: "Bea Lawson", racket: "Yonex Astrox 99 Pro", rid: "R-0371", string: "BG80 Power", family: "var(--string-multi)", tension: "12.5 kg", due: "Tomorrow 12:00", status: "Received", tone: "neutral", price: 32.0, paid: false },
    { id: "SC-1038", customer: "Daniel Foo", racket: "Yonex EZONE 100 (2025)", rid: "R-0366", string: "Hyper-G 1.25", family: "var(--string-poly)", tension: "24 kg", due: "Wed 09:00", status: "Received", tone: "neutral", price: 35.0, paid: false },
  ] as JobRow[],

  ready: [
    { id: "SC-1035", customer: "Alina Petrova", racket: "Head Radical Pro", since: "3 days", price: 35.0, paid: true },
    { id: "SC-1033", customer: "Kenneth Lim", racket: "Yonex Nanoflare 800", since: "4 days", price: 30.0, paid: false },
    { id: "SC-1031", customer: "Wei Sheng Ong", racket: "Babolat Pure Drive", since: "6 days", price: 38.0, paid: false },
    { id: "SC-1028", customer: "Priya Nair", racket: "Head Boom MP", since: "9 days", price: 41.5, paid: true },
  ] as ReadyRow[],

  lowStock: [
    { name: "Solinco Hyper-G 1.25 green", detail: "Reel · 200 m", left: 18.5, of: 200, unit: "m", threshold: 25, family: "var(--string-poly)" },
    { name: "Yonex Super Grap overgrip", detail: "White · single", left: 6, of: 60, unit: "pcs", threshold: 12, family: null },
    { name: "Luxilon ALU Power 125", detail: "Reel · 200 m", left: 31.0, of: 200, unit: "m", threshold: 40, family: "var(--string-poly)" },
    { name: "Babolat VS Touch 1.30", detail: "Set · natural gut", left: 2, of: 10, unit: "sets", threshold: 4, family: "var(--string-gut)" },
  ] as LowStockRow[],

  sales: [
    { id: "S-0884", customer: "Marta Ellis", items: "String job SC-1036 · Overgrip × 3", total: 49.0, method: "PayNow", when: "Today 11:42" },
    { id: "S-0883", customer: "Walk-in", items: "Hyper-G 1.25 set × 2", total: 36.0, method: "Cash", when: "Today 10:15" },
    { id: "S-0882", customer: "Daniel Foo", items: "Yonex EZONE 100 (2025)", total: 359.0, method: "Card", when: "Today 09:38" },
    { id: "S-0881", customer: "Kenneth Lim", items: "String job SC-1030 · Dampener", total: 35.0, method: "PayNow", when: "Yesterday 18:20" },
    { id: "S-0880", customer: "Jo Kerrigan", items: "Overgrip × 6 · Grip tape", total: 27.5, method: "PayNow", when: "Yesterday 17:04" },
  ] as SaleRow[],
};
