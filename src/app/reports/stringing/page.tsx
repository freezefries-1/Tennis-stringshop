import { getStringingOverview, listStringUsage, listStringBrandAnalysis, getStringSetupAnalytics } from "@/lib/reports-stringing";
import { listRacketBrandCounts, listRacketSeriesCounts, listRacketModelCounts, getRestringFrequency, getPotentiallyDueForRestring } from "@/lib/reports-rackets";
import { resolveDateParams } from "@/lib/date-filter";
import { StringingReportsView } from "@/components/reports/stringing-reports-view";

export const dynamic = "force-dynamic";

export default async function StringingReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const filters = resolveDateParams(sp);

  const [overview, stringUsage, brandAnalysis, setupAnalytics, racketBrands, racketSeries, racketModels, restringFrequency, potentiallyDue] = await Promise.all([
    getStringingOverview(filters),
    listStringUsage(filters),
    listStringBrandAnalysis(filters),
    getStringSetupAnalytics(filters),
    listRacketBrandCounts(filters),
    listRacketSeriesCounts(filters),
    listRacketModelCounts(filters),
    getRestringFrequency(),
    getPotentiallyDueForRestring(),
  ]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Stringing reports</h2>
      <StringingReportsView
        overview={overview}
        stringUsage={stringUsage}
        brandAnalysis={brandAnalysis}
        setupAnalytics={setupAnalytics}
        racketBrands={racketBrands}
        racketSeries={racketSeries}
        racketModels={racketModels}
        restringFrequency={restringFrequency}
        potentiallyDue={potentiallyDue}
        initialFrom={sp.from ?? ""}
        initialTo={sp.to ?? ""}
      />
    </div>
  );
}
