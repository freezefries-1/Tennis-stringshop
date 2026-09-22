import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/customers";
import { CustomerForm } from "@/components/customers/customer-form";
import { updateCustomerAction } from "@/app/customers/actions";
import type { CustomerFormState } from "@/lib/customer-form-types";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const initialState: CustomerFormState = {
    status: "idle",
    values: { name: customer.name, phone: customer.phone, email: customer.email ?? "", notes: customer.notes ?? "" },
  };

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Edit customer</h2>
      <CustomerForm action={updateCustomerAction.bind(null, id)} initialState={initialState} submitLabel="Save changes" />
    </div>
  );
}
