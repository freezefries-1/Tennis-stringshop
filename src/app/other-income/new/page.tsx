import { listCategoriesInUse } from "@/lib/other-income";
import { OtherIncomeForm } from "@/components/other-income/other-income-form";

export const dynamic = "force-dynamic";

export default async function NewOtherIncomePage() {
  const categories = await listCategoriesInUse();
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add income</h2>
      <OtherIncomeForm mode="create" categories={categories} />
    </div>
  );
}
