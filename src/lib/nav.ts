// Sidebar structure and per-screen metadata for the SportCraft Workshop shell.
// Mirrors docs/design-handoff/prototype/app/shell.jsx (NAV, PAGES).

export interface NavItem {
  section?: string;
  value?: string;
  label?: string;
  icon?: string;
  count?: number;
}

export const NAV: NavItem[] = [
  { section: "Bench" },
  { value: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { value: "jobs", label: "String jobs", icon: "wrench", count: 12 },
  { value: "pos", label: "POS", icon: "scan-line" },
  { section: "People" },
  { value: "customers", label: "Customers", icon: "users" },
  { value: "rackets", label: "Rackets", icon: "circle-dot" },
  { section: "Stock" },
  { value: "inventory", label: "Inventory", icon: "layers", count: 4 },
  { value: "products", label: "Products", icon: "package" },
  { value: "catalogue", label: "Racket database", icon: "library" },
  { section: "Money" },
  { value: "expenses", label: "Expenses", icon: "receipt" },
  { value: "reports", label: "Reports", icon: "bar-chart-3" },
];

export const FOOTER_NAV: NavItem[] = [
  { value: "settings", label: "Settings", icon: "settings" },
  { value: "checklist", label: "Phase 1 checklist", icon: "clipboard-check" },
];

export interface PageMeta {
  title: string;
  label: string;
  action: string | null;
  /** When set, the top bar's action button is a real link (the page is
   * built). Omitted for pages still on the phase plan, whose action button
   * stays decorative until their phase lands. */
  actionHref?: string;
  phase?: number;
  builds?: string[];
}

export const PAGES: Record<string, PageMeta> = {
  dashboard: { title: "Dashboard", label: "Workshop", action: null },
  jobs: {
    title: "String jobs",
    label: "Bench",
    action: "New string job",
    actionHref: "/jobs/new",
  },
  pos: {
    title: "POS",
    label: "Bench",
    action: "New sale",
    phase: 6,
    builds: [
      "Customer-optional cart, multiple items, quantities",
      "Completed string jobs appear as pending lines",
      "Sale-level discount, PayNow / cash / transfer / card",
      "Stock deducted per line from its batch",
      "Reversing sales for returns — records are never edited",
    ],
  },
  customers: {
    title: "Customers",
    label: "People",
    action: "Add customer",
    actionHref: "/customers/new",
  },
  rackets: {
    title: "Rackets",
    label: "People",
    action: "Add racket",
    phase: 2,
    builds: [
      "Every physical frame its own ID — two identical frames stay separate",
      "Specs: grip size, static weight, swingweight, balance",
      "Customisation and general notes",
      "Per-racket service history and average days between restrings",
    ],
  },
  inventory: {
    title: "Inventory",
    label: "Stock",
    action: "Receive stock",
    actionHref: "/inventory/receive",
  },
  products: {
    title: "Products",
    label: "Stock",
    action: "New product",
    phase: 6,
    builds: [
      "SKU, brand, category, variant, supplier",
      "Cost and selling price, reorder level, archive",
      "String products carry gauge, colour, material and reel length",
      "One catalogue — strings and hard goods are not separate systems",
    ],
  },
  catalogue: {
    title: "Racket database",
    label: "Stock",
    action: "Add model",
    actionHref: "/catalogue/models/new",
  },
  expenses: {
    title: "Expenses",
    label: "Money",
    action: "New expense",
    phase: 7,
    builds: [
      "Date, category, supplier, description, amount, payment method",
      "Nine default categories plus your own",
      "Stock purchases are excluded — they are recorded as inventory, not expense",
      "Feeds net operating profit directly",
    ],
  },
  reports: {
    title: "Reports",
    label: "Money",
    action: "Export CSV",
    phase: 8,
    builds: [
      "P&L by day, week, month, year or custom range",
      "Filter by stringing, product sales, customisation, other services",
      "Top strings by usage and by margin, best sellers, inventory value",
      "Customer lifetime value, repeat rate, jobs per month",
    ],
  },
  settings: {
    title: "Settings",
    label: "Workshop",
    action: null,
  },
  checklist: { title: "Phase 1 checklist", label: "Build", action: null },
};

export const DEFAULT_PAGE = "dashboard";
