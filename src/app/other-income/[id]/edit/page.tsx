import { notFound } from "next/navigation";
import { getOtherIncome, listCategoriesInUse } from "@/lib/other-income";
import { OtherIncomeForm } from "@/components/other-income/other-income-form";

export const dynamic = "force-dynamic";

export default async function EditOtherIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [income, categories] = await Promise.all([getOtherIncome(id), listCategoriesInUse()]);
  if (!income) notFound();

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Edit income</h2>
      <OtherIncomeForm mode="edit" income={income} categories={categories} />
    </div>
  );
}
