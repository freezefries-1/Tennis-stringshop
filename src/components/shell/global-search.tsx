"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ds/input";
import { DATA, type JobRow, type ReadyRow } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { searchCustomers, type CustomerSearchHit } from "./search-actions";

type JobLike = JobRow | ReadyRow;

interface ResultItem {
  t: string;
  s: string;
  href: string;
}

interface ResultGroup {
  k: string;
  items: ResultItem[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [customerHits, setCustomerHits] = useState<CustomerSearchHit[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        box.current?.querySelector("input")?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, []);

  // Real customers, debounced — the only group backed by the live database.
  // Stale hits from a previous query are filtered out at render time (the
  // `q.trim()` guard below and in `groups`), so there's nothing to clear
  // here — this effect only ever sets state inside the timeout callback.
  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      try {
        const hits = await searchCustomers(query);
        if (active) setCustomerHits(hits);
      } catch (err) {
        // A failed search shouldn't crash the panel — seed-data groups
        // (Rackets, String jobs, …) still render below. Logged so a real
        // failure (vs. an empty result) is visible in the console instead
        // of looking identical to "no customers matched".
        if (active) console.error("Customer search failed:", err);
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  const seedGroups = useMemo<ResultGroup[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const hit = (t: string) => t.toLowerCase().includes(s);
    const g: ResultGroup[] = [];

    const jobsAndReady: JobLike[] = [...DATA.jobs, ...DATA.ready];

    const rk = DATA.jobs.filter((j) => hit(j.racket) || hit(j.rid)).slice(0, 4);
    if (rk.length) g.push({ k: "Rackets", items: rk.map((j) => ({ t: j.racket, s: `${j.rid} · ${j.customer}`, href: "/rackets" })) });

    const jb = jobsAndReady.filter((j) => hit(j.id) || hit(j.customer) || ("string" in j && hit(j.string))).slice(0, 5);
    if (jb.length) g.push({ k: "String jobs", items: jb.map((j) => ({ t: j.id, s: `${j.customer} · ${j.racket}`, href: "/jobs" })) });

    const pr = DATA.topProducts.filter((p) => hit(p.label)).slice(0, 4);
    if (pr.length) g.push({ k: "Products", items: pr.map((p) => ({ t: p.label, s: `${p.qty} sold`, href: "/products" })) });

    const sl = DATA.sales.filter((x) => hit(x.id) || hit(x.customer)).slice(0, 3);
    if (sl.length) g.push({ k: "Sales", items: sl.map((x) => ({ t: x.id, s: `${x.customer} · ${formatMoney(x.total)}`, href: "/pos" })) });

    return g;
  }, [q]);

  const groups = useMemo<ResultGroup[]>(() => {
    const g: ResultGroup[] = [];
    if (q.trim() && customerHits.length) {
      g.push({
        k: "Customers",
        items: customerHits.map((c) => ({ t: c.name, s: `${c.code} · ${c.phone}`, href: `/customers/${c.id}` })),
      });
    }
    return [...g, ...seedGroups];
  }, [customerHits, seedGroups, q]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="search" ref={box}>
      <Input
        iconLeft="search"
        placeholder="Search customer, racket, job, product"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        size="sm"
        style={{ width: "100%" }}
      />
      {!q && <span className="kbd num">⌘K</span>}
      {open && q.trim() ? (
        <div className="results">
          {groups.length === 0 ? (
            <div className="res-empty">No match for “{q}”. Try a phone number or a job ID.</div>
          ) : (
            groups.map((g) => (
              <div key={g.k}>
                <div className="res-h lab">{g.k}</div>
                {g.items.map((it, i) => (
                  <button className="res" key={g.k + i} onClick={() => go(it.href)}>
                    <span className="res-t">{it.t}</span>
                    <span className="res-s num">{it.s}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
