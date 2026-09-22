"use client";

import { useState } from "react";
import { Combobox } from "@/components/ds/combobox";
import { Card } from "@/components/ds/card";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Button } from "@/components/ds/button";
import { quickCreateCustomerForJob } from "@/app/jobs/actions";

export interface PickerCustomer {
  id: string;
  code: string;
  name: string;
  phone: string;
}

function QuickAddCustomer({ initialName, onCreated, onCancel }: { initialName: string; onCreated: (c: PickerCustomer) => void; onCancel: () => void }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="lab">Add customer</div>
      <div className="form-grid">
        <Field label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Phone" required>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" style={{ width: "100%" }} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          size="sm"
          disabled={saving || !name.trim() || !phone.trim()}
          onClick={async () => {
            setSaving(true);
            const created = await quickCreateCustomerForJob(name, phone);
            setSaving(false);
            onCreated(created);
          }}
        >
          {saving ? "Saving…" : "Save customer"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export function CustomerPicker({ customers, selected, onSelect }: { customers: PickerCustomer[]; selected: PickerCustomer | null; onSelect: (c: PickerCustomer | null) => void }) {
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Combobox
        label="Customer"
        placeholder="Search name, phone or customer ID"
        options={customers}
        getLabel={(c) => `${c.name} · ${c.code} · ${c.phone}`}
        getKey={(c) => c.id}
        selected={selected}
        addNewLabel="Add customer"
        onSelect={onSelect}
        onAddNew={(q) => setQuickAdd(q)}
      />
      {quickAdd !== null ? (
        <QuickAddCustomer
          initialName={quickAdd}
          onCancel={() => setQuickAdd(null)}
          onCreated={(c) => {
            onSelect(c);
            setQuickAdd(null);
          }}
        />
      ) : null}
    </div>
  );
}
