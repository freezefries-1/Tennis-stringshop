import { getInventoryDefaults, getStringUsageDefaults } from "@/lib/settings";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [stringUsage, inventory] = await Promise.all([getStringUsageDefaults(), getInventoryDefaults()]);
  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <h2 className="ph-title">Settings</h2>
      <div style={{ marginTop: 16 }}>
        <SettingsView stringUsage={stringUsage} inventory={inventory} />
      </div>
    </div>
  );
}
