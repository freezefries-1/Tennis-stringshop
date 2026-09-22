"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Icon } from "@/components/ds/icon";
import { Badge } from "@/components/ds/badge";
import { fetchSeriesForBrand, type RacketBrand, type RacketSeries } from "@/components/customers/racket-picker-actions";
import {
  archiveBrandAction,
  archiveSeriesAction,
  createBrandAction,
  createSeriesAction,
  renameBrandAction,
  renameSeriesAction,
} from "@/app/catalogue/actions";

function SeriesRow({ series }: { series: RacketSeries }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(series.name);
  const [archived, setArchived] = useState(!!series.archivedAt);

  if (editing) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} size="sm" style={{ flex: 1 }} />
        <Button
          size="sm"
          onClick={async () => {
            await renameSeriesAction(series.id, name);
            setEditing(false);
          }}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="row-main">
        <div className="row-t">{name}</div>
      </div>
      <div className="row-end" style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        {archived ? <Badge tone="neutral">Archived</Badge> : null}
        <button type="button" onClick={() => setEditing(true)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}>
          <Icon name="pencil" size={15} />
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            if (!archived && !confirm(`Archive series "${name}"? It stays visible on existing racket models.`)) return;
            await archiveSeriesAction(series.id, !archived);
            setArchived((a) => !a);
          }}
        >
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </div>
    </div>
  );
}

function BrandCard({ brand, autoOpen }: { brand: RacketBrand; autoOpen?: boolean }) {
  const [open, setOpen] = useState(!!autoOpen);
  const [series, setSeries] = useState<RacketSeries[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [archived, setArchived] = useState(!!brand.archivedAt);
  const [addingSeries, setAddingSeries] = useState(!!autoOpen);
  const [newSeriesName, setNewSeriesName] = useState("");

  useEffect(() => {
    if (open && series === null) {
      fetchSeriesForBrand(brand.id).then(setSeries);
    }
  }, [open, series, brand.id]);

  return (
    <Card padding="16px 20px">
      <div
        role={editing ? undefined : "button"}
        tabIndex={editing ? undefined : 0}
        onClick={editing ? undefined : () => setOpen((o) => !o)}
        onKeyDown={
          editing
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }
        }
        aria-expanded={editing ? undefined : open}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: editing ? undefined : "pointer" }}
      >
        <span
          aria-hidden="true"
          style={{ display: "flex", color: "var(--ink-500)" }}
        >
          <Icon name="chevron-right" size={16} style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 140ms" }} />
        </span>
        {editing ? (
          <>
            <Input value={name} onChange={(e) => setName(e.target.value)} size="sm" style={{ flex: 1 }} />
            <Button
              size="sm"
              onClick={async () => {
                await renameBrandAction(brand.id, name);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>{name}</span>
            {archived ? <Badge tone="neutral">Archived</Badge> : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}
            >
              <Icon name="pencil" size={15} />
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async (e) => {
                e.stopPropagation();
                if (!archived && !confirm(`Archive brand "${name}"? It stays visible on existing racket models.`)) return;
                await archiveBrandAction(brand.id, !archived);
                setArchived((a) => !a);
              }}
            >
              {archived ? "Unarchive" : "Archive"}
            </Button>
          </>
        )}
      </div>

      {open ? (
        <div style={{ marginTop: 12, paddingLeft: 26 }}>
          {series === null ? (
            <div className="row-s">Loading…</div>
          ) : series.length === 0 && !addingSeries ? (
            <div className="row-s">No series yet.</div>
          ) : (
            <div className="rows">
              {series.map((s) => (
                <SeriesRow key={s.id} series={s} />
              ))}
            </div>
          )}
          {addingSeries ? (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Field label="New series name" style={{ flex: 1 }}>
                <Input value={newSeriesName} onChange={(e) => setNewSeriesName(e.target.value)} style={{ width: "100%" }} />
              </Field>
              <Button
                size="sm"
                disabled={!newSeriesName.trim()}
                onClick={async () => {
                  const created = await createSeriesAction(brand.id, newSeriesName);
                  setSeries((prev) => [...(prev ?? []), created]);
                  setNewSeriesName("");
                  setAddingSeries(false);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingSeries(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" iconLeft="plus" onClick={() => setAddingSeries(true)} style={{ marginTop: 10 }}>
              Add series
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export function BrandsView({ brands: initialBrands }: { brands: RacketBrand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {brands.map((b) => (
        <BrandCard key={b.id} brand={b} autoOpen={b.id === justCreatedId} />
      ))}

      {addingBrand ? (
        <Card tone="sunken" padding="16px 20px" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Field label="New brand name" style={{ flex: 1 }}>
            <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <Button
            size="sm"
            disabled={!newBrandName.trim()}
            onClick={async () => {
              const created = await createBrandAction(newBrandName);
              setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
              setNewBrandName("");
              setAddingBrand(false);
              setJustCreatedId(created.id);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingBrand(false)}>
            Cancel
          </Button>
        </Card>
      ) : (
        <Button variant="secondary" iconLeft="plus" onClick={() => setAddingBrand(true)} style={{ alignSelf: "flex-start" }}>
          Add brand
        </Button>
      )}
    </div>
  );
}
