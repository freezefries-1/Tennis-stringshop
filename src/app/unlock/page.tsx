import { UnlockForm } from "./unlock-form";

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return <UnlockForm next={sp.next ?? "/dashboard"} />;
}
