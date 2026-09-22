import { ModelForm } from "@/components/catalogue/model-form";
import { createModelAction } from "@/app/catalogue/actions";
import { emptyModelFormState } from "@/lib/model-form-types";

export default function NewModelPage() {
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add racket model</h2>
      <ModelForm action={createModelAction} initialState={emptyModelFormState} submitLabel="Save model" />
    </div>
  );
}
