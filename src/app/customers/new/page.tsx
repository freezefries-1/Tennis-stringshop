import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomerAction } from "@/app/customers/actions";
import { emptyCustomerFormState } from "@/lib/customer-form-types";

export default function NewCustomerPage() {
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add customer</h2>
      <CustomerForm action={createCustomerAction} initialState={emptyCustomerFormState} submitLabel="Save customer" />
    </div>
  );
}
