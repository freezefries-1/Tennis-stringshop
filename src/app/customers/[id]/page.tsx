import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer, getCustomerStats } from "@/lib/customers";
import { listRacketsForCustomer } from "@/lib/rackets";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { IconButton } from "@/components/ds/icon-button";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { CustomerProfileTabs } from "@/components/customers/customer-profile-tabs";
import { formatCents, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [stats, rackets] = await Promise.all([getCustomerStats(id), listRacketsForCustomer(id, true)]);

  const items: SpecListItem[] = [
    { label: "Phone", value: customer.phone },
    { label: "Email", value: customer.email ?? "—" },
    { label: "Notes", value: customer.notes ?? "—" },
    { label: "Date joined", value: formatDate(customer.createdAt) },
    { label: "Last visit", value: formatDate(stats.lastVisit) },
    { label: "Lifetime spend", value: <span className="num">{formatCents(stats.lifetimeSpendCents)}</span> },
    { label: "String jobs", value: <span className="num">{stats.jobCount}</span> },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">{customer.code}</div>
          <h2 className="profile-name">{customer.name}</h2>
        </div>
        <div className="profile-actions">
          <Link href={`/customers/${customer.id}/rackets/new`}>
            <Button size="sm" variant="secondary" iconLeft="plus">
              Add racket
            </Button>
          </Link>
          <Link href="/jobs">
            <Button size="sm" variant="secondary">
              New string job
            </Button>
          </Link>
          <Link href="/pos">
            <Button size="sm" variant="secondary">
              New sale
            </Button>
          </Link>
          <Link href={`/customers/${customer.id}/edit`}>
            <IconButton icon="pencil" label="Edit customer" variant="outline" size="sm" />
          </Link>
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Contact
          </div>
          <SpecList dense items={items} />
        </Card>

        <CustomerProfileTabs customerId={customer.id} rackets={rackets} />
      </div>
    </div>
  );
}
