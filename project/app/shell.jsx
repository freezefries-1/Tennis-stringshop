const { Card, Button, IconButton, Icon, Badge, Input, Tag } = window.SportCraftDesignSystem_1803c2;
const SD = window.SC_DATA;
const { useState, useMemo, useEffect, useRef } = React;

const NAV = [
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
  { value: "reports", label: "Reports", icon: "bar-chart-3" }
];

const PAGES = {
  dashboard: { title: "Dashboard", label: "Workshop", action: null },
  jobs: { title: "String jobs", label: "Bench", action: "New string job", phase: 4, builds: ["Job creation with a customer-filtered racket select", "Full-bed and hybrid setups, kg or lb", "Last setup panel and Repeat previous setup", "Received → Waiting → In progress → Completed → Collected", "Quick actions from customer and racket profiles"] },
  pos: { title: "POS", label: "Bench", action: "New sale", phase: 6, builds: ["Customer-optional cart, multiple items, quantities", "Completed string jobs appear as pending lines", "Sale-level discount, PayNow / cash / transfer / card", "Stock deducted per line from its batch", "Reversing sales for returns — records are never edited"] },
  customers: { title: "Customers", label: "People", action: "New customer", phase: 2, builds: ["List, create, edit, archive", "Profile: contact, rackets, stringing and purchase history", "Derived lifetime spend, job count, last visit, typical tension", "Search by name, phone or customer ID", "New string job straight from the profile"] },
  rackets: { title: "Rackets", label: "People", action: "Add racket", phase: 2, builds: ["Every physical frame its own ID — two identical frames stay separate", "Specs: grip size, static weight, swingweight, balance", "Customisation and general notes", "Per-racket service history and average days between restrings"] },
  inventory: { title: "Inventory", label: "Stock", action: "Receive stock", phase: 5, builds: ["Reels tracked in metres, sets and products in units", "Batches with their own purchase cost — FIFO consumption", "Full movement ledger: purchase, sale, string job, adjustment, return, write-off", "Low-stock thresholds and inventory value", "Negative stock blocked unless explicitly overridden"] },
  products: { title: "Products", label: "Stock", action: "New product", phase: 6, builds: ["SKU, brand, category, variant, supplier", "Cost and selling price, reorder level, archive", "String products carry gauge, colour, material and reel length", "One catalogue — strings and hard goods are not separate systems"] },
  catalogue: { title: "Racket database", label: "Stock", action: "Add model", phase: 3, builds: ["Brand → series → model → generation, all editable in the interface", "Head size, string pattern, unstrung weight per generation", "Dependent searchable selects when adding a customer racket", "Archive, never delete — customer rackets point here"] },
  expenses: { title: "Expenses", label: "Money", action: "New expense", phase: 7, builds: ["Date, category, supplier, description, amount, payment method", "Nine default categories plus your own", "Stock purchases are excluded — they are recorded as inventory, not expense", "Feeds net operating profit directly"] },
  reports: { title: "Reports", label: "Money", action: "Export CSV", phase: 8, builds: ["P&L by day, week, month, year or custom range", "Filter by stringing, product sales, customisation, other services", "Top strings by usage and by margin, best sellers, inventory value", "Customer lifetime value, repeat rate, jobs per month"] },
  settings: { title: "Settings", label: "Workshop", action: null, phase: 1, builds: ["Business name, currency — SportCraft, SGD", "Default labour charge and default string usage in metres", "Payment methods, expense categories, product categories", "String job statuses and low-stock thresholds", "CSV import and export, backup schedule"] },
  checklist: { title: "Phase 1 checklist", label: "Build", action: null }
};

function GlobalSearch({ onNav }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const key = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); box.current.querySelector("input").focus(); setOpen(true); } if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", key); };
  }, []);
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const hit = t => t.toLowerCase().includes(s);
    const g = [];
    const cust = [...new Set(SD.jobs.concat(SD.ready).map(j => j.customer).concat(SD.sales.map(x => x.customer)))].filter(c => c !== "Walk-in" && hit(c)).slice(0, 4);
    if (cust.length) g.push({ k: "Customers", items: cust.map(c => ({ t: c, s: "Customer", go: "customers" })) });
    const rk = SD.jobs.filter(j => hit(j.racket) || hit(j.rid)).slice(0, 4);
    if (rk.length) g.push({ k: "Rackets", items: rk.map(j => ({ t: j.racket, s: `${j.rid} · ${j.customer}`, go: "rackets" })) });
    const jb = SD.jobs.concat(SD.ready).filter(j => hit(j.id) || hit(j.customer) || hit(j.string || "")).slice(0, 5);
    if (jb.length) g.push({ k: "String jobs", items: jb.map(j => ({ t: j.id, s: `${j.customer} · ${j.racket}`, go: "jobs" })) });
    const pr = SD.topProducts.filter(p => hit(p.label)).slice(0, 4);
    if (pr.length) g.push({ k: "Products", items: pr.map(p => ({ t: p.label, s: `${p.qty} sold`, go: "products" })) });
    const sl = SD.sales.filter(x => hit(x.id) || hit(x.customer)).slice(0, 3);
    if (sl.length) g.push({ k: "Sales", items: sl.map(x => ({ t: x.id, s: `${x.customer} · ${SD.fmt(x.total)}`, go: "pos" })) });
    return g;
  }, [q]);
  return (
    <div className="search" ref={box}>
      <Input iconLeft="search" placeholder="Search customer, racket, job, product" value={q} onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }} size="sm" style={{ width: "100%" }} />
      {!q && <span className="kbd num">⌘K</span>}
      {open && q.trim() ? (
        <div className="results">
          {groups.length === 0 ? <div className="res-empty">No match for “{q}”. Try a phone number or a job ID.</div> :
            groups.map(g => (
              <div key={g.k}>
                <div className="res-h lab">{g.k}</div>
                {g.items.map((it, i) => (
                  <button className="res" key={g.k + i} onClick={() => { onNav(it.go); setOpen(false); setQ(""); }}>
                    <span className="res-t">{it.t}</span><span className="res-s num">{it.s}</span>
                  </button>
                ))}
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ page, onNav }) {
  return (
    <aside className="side">
      <div className="brand">
        <span className="brand-n">SportCraft</span>
        <span className="brand-t num">Workshop</span>
      </div>
      <nav className="nav">
        {NAV.map((n, i) => n.section ? <div className="nav-s lab" key={"s" + i}>{n.section}</div> : (
          <button key={n.value} className={"nav-i" + (page === n.value ? " on" : "")} onClick={() => onNav(n.value)}>
            <Icon name={n.icon} size={17} />
            <span>{n.label}</span>
            {n.count ? <span className="nav-c num">{n.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="side-f">
        <button className={"nav-i" + (page === "settings" ? " on" : "")} onClick={() => onNav("settings")}><Icon name="settings" size={17} /><span>Settings</span></button>
        <button className={"nav-i" + (page === "checklist" ? " on" : "")} onClick={() => onNav("checklist")}><Icon name="clipboard-check" size={17} /><span>Phase 1 checklist</span></button>
      </div>
    </aside>
  );
}

function MobileNav({ page, onNav, onMore }) {
  const tabs = [
    { v: "jobs", l: "Jobs", i: "wrench" },
    { v: "customers", l: "Customers", i: "users" },
    { v: "__new", l: "New", i: "plus" },
    { v: "pos", l: "POS", i: "scan-line" },
    { v: "__more", l: "More", i: "menu" }
  ];
  return (
    <nav className="mnav">
      {tabs.map(t => t.v === "__new" ? (
        <button key={t.v} className="mnav-new" onClick={onMore} aria-label="New"><Icon name="plus" size={22} /></button>
      ) : (
        <button key={t.v} className={"mnav-i" + (page === t.v ? " on" : "")} onClick={() => t.v === "__more" ? onMore() : onNav(t.v)}>
          <Icon name={t.i} size={20} /><span>{t.l}</span>
        </button>
      ))}
    </nav>
  );
}

function MoreSheet({ open, onClose, onNav }) {
  if (!open) return null;
  const items = NAV.filter(n => n.value).concat([{ value: "settings", label: "Settings", icon: "settings" }, { value: "checklist", label: "Phase 1 checklist", icon: "clipboard-check" }]);
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-h"><div className="lab">Go to</div><IconButton icon="x" label="Close" onClick={onClose} /></div>
        <div className="sheet-g">
          {items.map(n => (
            <button key={n.value} className="sheet-i" onClick={() => { onNav(n.value); onClose(); }}>
              <Icon name={n.icon} size={18} /><span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ page }) {
  const p = PAGES[page];
  return (
    <div className="ph-wrap">
      <Card padding="32px">
        <div className="lab">Phase {p.phase}</div>
        <h2 className="ph-title">{p.title} is not built yet</h2>
        <p className="ph-body">Phase 1 delivers the shell, navigation and dashboard only. The schema behind this screen is already designed — see the architecture document. When phase {p.phase} runs, this screen gets:</p>
        <ul className="ph-list">{p.builds.map(b => <li key={b}><Icon name="check" size={15} color="var(--court-500)" /><span>{b}</span></li>)}</ul>
      </Card>
    </div>
  );
}

const CHECKS = [
  { g: "Navigation", items: ["Every sidebar item opens its screen and stays highlighted", "Sidebar groups read Bench, People, Stock, Money — settings and checklist sit in the footer", "Counts show on String jobs and Inventory", "Browser back and a page refresh keep you on the same screen"] },
  { g: "Global search", items: ["⌘K focuses the field from any screen", "Typing “blade”, “SC-10”, “marta” or “overgrip” returns grouped results", "Results are grouped by customer, racket, job, product, sale", "A no-match query shows the empty state, not a blank box", "Escape or a click outside closes the results"] },
  { g: "Dashboard", items: ["Today, this month and year to date all read in SGD", "Gross profit equals revenue minus COGS in both P&L cards", "Net profit equals gross profit minus expenses", "The 12-month chart bars are proportional and labelled", "Every panel has a working link to its section"] },
  { g: "Responsive", items: ["At 375px the sidebar is replaced by the bottom tab bar", "More opens the full section list as a sheet", "No horizontal scrolling on any screen at 375px", "Stat cards stack to one or two columns, never overflow", "Tap targets on the bottom bar are at least 44px"] },
  { g: "Design system", items: ["Only court green, paper and ink surfaces — one accent at most per view", "Every figure is IBM Plex Mono with tabular numerals", "No gradients, no emoji, no coloured shadows", "Cards are 8px radius, 1px hairline border, 24px padding"] }
];

function Checklist() {
  return (
    <div className="ph-wrap">
      <Card padding="32px">
        <div className="lab">Phase 1 · foundation</div>
        <h2 className="ph-title">Test this before phase 2 starts</h2>
        <p className="ph-body">Ten minutes, on the bench computer and then on your phone. Anything that fails gets fixed before customers go in.</p>
        <div className="chk">
          {CHECKS.map(c => (
            <div className="chk-g" key={c.g}>
              <div className="lab">{c.g}</div>
              <ul>{c.items.map(i => <li key={i}><span className="chk-box"></span><span>{i}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function App() {
  const [page, setPage] = useState(() => (location.hash || "#dashboard").slice(1));
  const [more, setMore] = useState(false);
  useEffect(() => {
    const h = () => setPage((location.hash || "#dashboard").slice(1));
    window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h);
  }, []);
  const nav = v => { location.hash = v; setPage(v); window.scrollTo(0, 0); };
  const p = PAGES[page] || PAGES.dashboard;
  return (
    <div className="app">
      <Sidebar page={page} onNav={nav} />
      <main className="main">
        <header className="top">
          <div className="top-t">
            <div className="lab">{p.label}</div>
            <h1>{p.title}</h1>
          </div>
          <GlobalSearch onNav={nav} />
          <div className="top-a">
            {p.action ? <Button size="sm" iconLeft="plus">{p.action}</Button> : null}
            {page === "dashboard" ? <Button size="sm" iconLeft="plus">New string job</Button> : null}
          </div>
        </header>
        <div className="body">
          {page === "dashboard" ? <Dashboard onNav={nav} /> : page === "checklist" ? <Checklist /> : <Placeholder page={PAGES[page] ? page : "dashboard"} />}
        </div>
      </main>
      <MobileNav page={page} onNav={nav} onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} onNav={nav} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("sc-app")).render(<App />);
