import { getInventoryDefaults, getStringUsageDefaults } from "@/lib/settings";
import { listPatternDefaults } from "@/lib/string-usage";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [stringUsage, inventory, patternDefaults] = await Promise.all([getStringUsageDefaults(), getInventoryDefaults(), listPatternDefaults()]);
  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <h2 className="ph-title">Settings</h2>
      <div style={{ marginTop: 16 }}>
        <SettingsView stringUsage={stringUsage} inventory={inventory} patternDefaults={patternDefaults} />
      </div>
    </div>
  );
}
