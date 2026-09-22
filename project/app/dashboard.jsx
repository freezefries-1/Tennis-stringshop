const { Card, StatBlock, SpecList, Badge, Button, Icon, ProgressBar, Tag } = window.SportCraftDesignSystem_1803c2;
const D = window.SC_DATA;

function PanelHead({ label, title, action }) {
  return (
    <div className="ph">
      <div><div className="lab">{label}</div>{title ? <div className="ph-t">{title}</div> : null}</div>
      {action || null}
    </div>
  );
}

function Money({ v, dp, muted, strong }) {
  return <span className="num" style={{ color: muted ? "var(--ink-500)" : undefined, fontWeight: strong ? 500 : undefined }}>{D.fmt(v, dp)}</span>;
}

function PL({ d, label, extra }) {
  const items = [
    { label: "Revenue", value: <span className="num">{D.fmt0(d.rev)}</span> },
    { label: "COGS", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{D.fmt0(d.cogs)}</span> },
    { label: "Gross profit", value: <span className="num">{D.fmt0(d.gross)} <span className="pct">{Math.round((d.gross / d.rev) * 100)}%</span></span> },
    { label: "Expenses", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{D.fmt0(d.exp)}</span> }
  ].concat(extra || []);
  return (
    <Card padding="20px 24px 24px">
      <PanelHead label={label} />
      <SpecList dense items={items} />
      <div className="net"><span>Net profit</span><span className="num">{D.fmt0(d.net)}</span></div>
    </Card>
  );
}

// 12-month revenue bars, gross profit as the filled lower portion, jobs/month as a sparkline beneath.
function RevenueChart() {
  const rows = D.monthly, max = Math.max(...rows.map(r => r.rev));
  const jmax = Math.max(...rows.map(r => r.jobs)), jmin = Math.min(...rows.map(r => r.jobs));
  const pts = rows.map((r, i) => `${(i + 0.5) * (100 / rows.length)},${34 - ((r.jobs - jmin) / (jmax - jmin || 1)) * 28}`).join(" ");
  return (
    <Card padding="20px 24px 22px">
      <PanelHead label="Last 12 months" title="Revenue and gross profit" action={
        <div className="legend"><span><i style={{ background: "var(--court-600)" }}></i>Gross profit</span><span><i style={{ background: "var(--court-100)" }}></i>COGS</span></div>
      } />
      <div className="bars">
        {rows.map(r => (
          <div className="bar-col" key={r.m} title={`${r.m} · ${D.fmt0(r.rev)} revenue`}>
            <div className="bar-v num">{Math.round(r.rev / 100) / 10}k</div>
            <div className="bar-track">
              <div className="bar" style={{ height: (r.rev / max) * 100 + "%" }}>
                <div className="bar-cogs" style={{ height: (r.cogs / r.rev) * 100 + "%" }}></div>
              </div>
            </div>
            <div className="bar-x num">{r.m.slice(0, 3)}</div>
          </div>
        ))}
      </div>
      <div className="spark-wrap">
        <div className="lab" style={{ marginBottom: 6 }}>String jobs per month · {jmin}–{jmax}</div>
        <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="spark"><polyline points={pts} fill="none" stroke="var(--clay-500)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></svg>
      </div>
    </Card>
  );
}

function BarList({ label, title, rows, valueFmt, dotKey }) {
  const max = Math.max(...rows.map(r => r.v));
  return (
    <Card padding="20px 24px 22px">
      <PanelHead label={label} title={title} />
      <div className="blist">
        {rows.map(r => (
          <div className="blist-row" key={r.label}>
            <div className="blist-top">
              <span className="blist-l">{r.dot ? <i className="dot" style={{ background: r.dot }}></i> : null}{r.label}</span>
              <span className="num blist-v">{valueFmt(r)}</span>
            </div>
            <div className="blist-track"><div style={{ width: (r.v / max) * 100 + "%", background: r.fill || "var(--court-600)" }}></div></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReadyList({ onNav }) {
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}><PanelHead label={`Waiting for collection · ${D.ready.length}`} action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => onNav("jobs")}>All jobs</Button>} /></div>
      <div className="rows">
        {D.ready.map(j => (
          <div className="row" key={j.id}>
            <div className="row-main"><div className="row-t">{j.customer}</div><div className="row-s num">{j.id} · {j.racket}</div></div>
            <div className="row-end">
              <span className="row-s num">Ready {j.since}</span>
              {j.paid ? <Badge tone="success" dot>Paid</Badge> : <Badge tone="warning" dot>Unpaid</Badge>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LowStock({ onNav }) {
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}><PanelHead label={`Low stock · ${D.lowStock.length}`} action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => onNav("inventory")}>Receive stock</Button>} /></div>
      <div className="rows">
        {D.lowStock.map(s => (
          <div className="row" key={s.name}>
            <div className="row-main">
              <div className="row-t">{s.family ? <i className="dot" style={{ background: s.family }}></i> : null}{s.name}</div>
              <div className="row-s num">{s.detail} · reorder at {s.threshold} {s.unit}</div>
            </div>
            <div className="row-end" style={{ minWidth: 104 }}>
              <span className="num" style={{ color: s.left <= s.threshold / 2 ? "var(--signal-danger)" : "var(--signal-warning)", fontSize: 14 }}>{s.left} {s.unit}</span>
              <ProgressBar value={s.left} max={s.of} height={4} tone={s.left <= s.threshold / 2 ? "danger" : "warning"} style={{ width: 96 }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentJobs({ onNav }) {
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}><PanelHead label="Recent string jobs" action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => onNav("jobs")}>All jobs</Button>} /></div>
      <div className="rows">
        {D.jobs.map(j => (
          <div className="row" key={j.id}>
            <div className="row-main">
              <div className="row-t">{j.racket}</div>
              <div className="row-s num"><i className="dot" style={{ background: j.family }}></i>{j.id} · {j.customer} · {j.string} · {j.tension}</div>
            </div>
            <div className="row-end"><span className="row-s num">{j.due}</span><Badge tone={j.tone} dot>{j.status}</Badge></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentSales({ onNav }) {
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}><PanelHead label="Recent sales" action={<Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => onNav("pos")}>Open POS</Button>} /></div>
      <div className="rows">
        {D.sales.map(s => (
          <div className="row" key={s.id}>
            <div className="row-main"><div className="row-t">{s.customer}</div><div className="row-s num">{s.id} · {s.items}</div></div>
            <div className="row-end"><span className="row-s num">{s.method} · {s.when}</span><span className="num" style={{ fontSize: 14.5, fontWeight: 500 }}>{D.fmt(s.total)}</span></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Dashboard({ onNav }) {
  const t = D.today;
  return (
    <div className="dash">
      <div className="sec-head"><div className="lab">Today · {D.business.today}</div><div className="hair"></div></div>
      <div className="g4">
        <Card><StatBlock label="Revenue" value={D.fmt0(t.revenue)} icon="banknote" /></Card>
        <Card><StatBlock label="String jobs" value={t.jobs} unit="done" icon="wrench" /></Card>
        <Card><StatBlock label="Products sold" value={t.products} unit="items" icon="package" /></Card>
        <Card>
          <ProgressBar label="Bench load" value={t.benchLoad} max={t.benchCapacity} valueLabel={`${t.benchLoad} / ${t.benchCapacity}`} />
          <div className="row-s num" style={{ marginTop: 12 }}>{t.dueToday} due today · {D.unbilled} completed but unbilled</div>
        </Card>
      </div>

      <div className="sec-head"><div className="lab">Profit and loss</div><div className="hair"></div></div>
      <div className="g2">
        <PL d={D.month} label="This month · September 2026" extra={[
          { label: "String jobs", value: <span className="num">{D.month.jobs}</span> },
          { label: "Average job value", value: <span className="num">{D.fmt(D.month.avgJob)}</span> }
        ]} />
        <PL d={D.ytd} label="Year to date · 2026" />
      </div>

      <div className="g1">
        <RevenueChart />
      </div>

      <div className="g3">
        <BarList label="Year to date" title="Revenue by category" rows={D.categories.map(c => ({ label: c.label, v: c.value, fill: c.tone }))} valueFmt={r => D.fmt0(r.v)} />
        <BarList label="Year to date" title="Most-used strings" rows={D.topStrings.map(s => ({ label: s.label, v: s.metres, dot: s.family, fill: "var(--court-500)" }))} valueFmt={r => r.v + " m"} />
        <BarList label="Year to date" title="Best-selling products" rows={D.topProducts.map(p => ({ label: p.label, v: p.rev, fill: "var(--clay-500)" }))} valueFmt={r => D.fmt0(r.v)} />
      </div>

      <div className="sec-head"><div className="lab">Needs attention</div><div className="hair"></div></div>
      <div className="g2"><ReadyList onNav={onNav} /><LowStock onNav={onNav} /></div>

      <div className="sec-head"><div className="lab">Activity</div><div className="hair"></div></div>
      <div className="g2"><RecentJobs onNav={onNav} /><RecentSales onNav={onNav} /></div>
    </div>
  );
}

Object.assign(window, { Dashboard, PanelHead, Money });
