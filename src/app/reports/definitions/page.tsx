import { Card } from "@/components/ds/card";

const DEFINITIONS: { term: string; definition: string }[] = [
  { term: "Net revenue", definition: "Sum of Sales totals in range, already net of returns — a return posts as its own reversing Sale (negative total), so this figure never needs a separate subtraction. Excludes cancelled sales entirely." },
  { term: "COGS (cost of goods sold)", definition: "The actual FIFO-computed cost of what was sold — from remaining batch cost at sale time for products/strings, or the manually recorded cost for a custom line item. Unknown/unrecorded cost is never treated as $0 silently — see Reports → Data quality." },
  { term: "Gross profit", definition: "Net revenue − COGS." },
  { term: "Gross margin", definition: "Gross profit ÷ Net revenue, as a percentage. Shown as \"—\", never 0% or a broken number, when revenue is zero." },
  { term: "Operating expenses", definition: "Recorded (non-voided) expenses with treatment = Operating, in range. Never includes inventory purchases (those become COGS when sold) or Capital/equipment purchases (tracked separately)." },
  { term: "Net profit", definition: "Gross profit − Operating expenses + Other income. Does NOT subtract Capital/equipment purchases — see Overall profit on the Financials page for the figure that does." },
  { term: "Net margin", definition: "Net profit ÷ Net revenue, as a percentage." },
  { term: "Average sale value", definition: "Total sales revenue for a customer or period ÷ number of sales in that same scope." },
  { term: "New customer", definition: "A customer whose first-ever qualifying activity (a non-cancelled Sale, or a completed/collected String Job) falls inside the selected period. Not meaningful for \"All time\" — there's nothing before an unbounded period." },
  { term: "Returning customer", definition: "A customer with qualifying activity before the selected period AND again during it." },
  { term: "Stringing revenue", definition: "Revenue from sale_items with item type \"string job service\" — the labour/string/grip charges on a completed job's linked Sale. Never a sum of String Job final_price_cents, which would double-count against Sales." },
  { term: "Retail revenue", definition: "Revenue from sale_items with item type \"product\" or \"string product\" (a retail sale, or a whole string reel/set sold on its own, not consumed by a job)." },
  { term: "Inventory value", definition: "Sum of each batch's remaining quantity × that batch's own purchase cost per unit (FIFO cost basis) — never selling price, never a flat \"latest purchase price × quantity\" if batches have different costs." },
  { term: "Estimated string consumption", definition: "The quantity recorded on a job's string line at save time, summed across completed/collected jobs. Labeled \"estimated\" because it's the recorded amount, not a physical remeasurement of what was actually used." },
];

export default function DefinitionsPage() {
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Analytics definitions</h2>
      <div className="rec-wrap">
        {DEFINITIONS.map((d) => (
          <Card key={d.term} padding="16px 18px">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.term}</div>
            <div className="row-s">{d.definition}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
