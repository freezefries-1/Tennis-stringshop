"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ds/input";
import { DATA, type JobRow, type ReadyRow } from "@/lib/data";
import { formatMoney } from "@/lib/format";

type JobLike = JobRow | ReadyRow;

interface ResultItem {
  t: string;
  s: string;
  go: string;
}

interface ResultGroup {
  k: string;
  items: ResultItem[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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

  const groups = useMemo<ResultGroup[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const hit = (t: string) => t.toLowerCase().includes(s);
    const g: ResultGroup[] = [];

    const jobsAndReady: JobLike[] = [...DATA.jobs, ...DATA.ready];
    const customerNames = [...jobsAndReady.map((j) => j.customer), ...DATA.sales.map((x) => x.customer)];

    const cust = [...new Set(customerNames)].filter((c) => c !== "Walk-in" && hit(c)).slice(0, 4);
    if (cust.length) g.push({ k: "Customers", items: cust.map((c) => ({ t: c, s: "Customer", go: "customers" })) });

    const rk = DATA.jobs.filter((j) => hit(j.racket) || hit(j.rid)).slice(0, 4);
    if (rk.length) g.push({ k: "Rackets", items: rk.map((j) => ({ t: j.racket, s: `${j.rid} · ${j.customer}`, go: "rackets" })) });

    const jb = jobsAndReady.filter((j) => hit(j.id) || hit(j.customer) || ("string" in j && hit(j.string))).slice(0, 5);
    if (jb.length) g.push({ k: "String jobs", items: jb.map((j) => ({ t: j.id, s: `${j.customer} · ${j.racket}`, go: "jobs" })) });

    const pr = DATA.topProducts.filter((p) => hit(p.label)).slice(0, 4);
    if (pr.length) g.push({ k: "Products", items: pr.map((p) => ({ t: p.label, s: `${p.qty} sold`, go: "products" })) });

    const sl = DATA.sales.filter((x) => hit(x.id) || hit(x.customer)).slice(0, 3);
    if (sl.length) g.push({ k: "Sales", items: sl.map((x) => ({ t: x.id, s: `${x.customer} · ${formatMoney(x.total)}`, go: "pos" })) });

    return g;
  }, [q]);

  const go = (target: string) => {
    router.push(`/${target}`);
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
                  <button className="res" key={g.k + i} onClick={() => go(it.go)}>
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
