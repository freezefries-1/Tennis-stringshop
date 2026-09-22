import { Card } from "@/components/ds/card";

const CHECKS = [
  {
    g: "Navigation",
    items: [
      "Every sidebar item opens its screen and stays highlighted",
      "Sidebar groups read Bench, People, Stock, Money — settings and checklist sit in the footer",
      "Counts show on String jobs and Inventory",
      "Browser back and a page refresh keep you on the same screen",
    ],
  },
  {
    g: "Global search",
    items: [
      "⌘K focuses the field from any screen",
      "Typing “blade”, “SC-10”, “marta” or “overgrip” returns grouped results",
      "Results are grouped by customer, racket, job, product, sale",
      "A no-match query shows the empty state, not a blank box",
      "Escape or a click outside closes the results",
    ],
  },
  {
    g: "Dashboard",
    items: [
      "Today, this month and year to date all read in SGD",
      "Gross profit equals revenue minus COGS in both P&L cards",
      "Net profit equals gross profit minus expenses",
      "The 12-month chart bars are proportional and labelled",
      "Every panel has a working link to its section",
    ],
  },
  {
    g: "Responsive",
    items: [
      "At 375px the sidebar is replaced by the bottom tab bar",
      "More opens the full section list as a sheet",
      "No horizontal scrolling on any screen at 375px",
      "Stat cards stack to one or two columns, never overflow",
      "Tap targets on the bottom bar are at least 44px",
    ],
  },
  {
    g: "Design system",
    items: [
      "Only court green, paper and ink surfaces — one accent at most per view",
      "Every figure is IBM Plex Mono with tabular numerals",
      "No gradients, no emoji, no coloured shadows",
      "Cards are 8px radius, 1px hairline border, 24px padding",
    ],
  },
];

export function Checklist() {
  return (
    <div className="ph-wrap">
      <Card padding="32px">
        <div className="lab">Phase 1 · foundation</div>
        <h2 className="ph-title">Test this before phase 2 starts</h2>
        <p className="ph-body">
          Ten minutes, on the bench computer and then on your phone. Anything that fails gets fixed before customers
          go in.
        </p>
        <div className="chk">
          {CHECKS.map((c) => (
            <div className="chk-g" key={c.g}>
              <div className="lab">{c.g}</div>
              <ul>
                {c.items.map((i) => (
                  <li key={i}>
                    <span className="chk-box" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
