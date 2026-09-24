import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Icon } from "@/components/ds/icon";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/reports/financial", icon: "bar-chart-3", title: "Financial", description: "P&L, period comparison, monthly performance, expenses." },
  { href: "/reports/stringing", icon: "wrench", title: "Stringing", description: "Job volume, string usage, brand mix, setup patterns, restring frequency." },
  { href: "/reports/products", icon: "package", title: "Products", description: "Units sold, revenue, gross profit, category breakdown, top sellers." },
  { href: "/reports/customers", icon: "users", title: "Customers", description: "Spend, visit frequency, new vs returning." },
  { href: "/reports/inventory", icon: "layers", title: "Inventory", description: "Stock value, movement, stock cover, slow-moving items." },
  { href: "/reports/data-quality", icon: "alert-circle", title: "Data quality", description: "Unknown costs, missing links, negative stock — for review, not the Dashboard." },
];

export default function ReportsPage() {
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Reports</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none", color: "inherit" }}>
            <Card interactive padding="20px" style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name={s.icon} size={20} color="var(--court-600)" />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>{s.title}</div>
              </div>
              <div className="row-s">{s.description}</div>
            </Card>
          </Link>
        ))}
      </div>
      <div>
        <Link href="/reports/definitions" style={{ color: "var(--court-600)" }}>
          Analytics definitions
        </Link>
      </div>
    </div>
  );
}
