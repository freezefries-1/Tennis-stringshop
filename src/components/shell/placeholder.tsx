import { Card } from "@/components/ds/card";
import { Icon } from "@/components/ds/icon";
import { PAGES } from "@/lib/nav";

export function Placeholder({ page }: { page: string }) {
  const p = PAGES[page];
  return (
    <div className="ph-wrap">
      <Card padding="32px">
        <div className="lab">Phase {p.phase}</div>
        <h2 className="ph-title">{p.title} is not built yet</h2>
        <p className="ph-body">
          Phase 1 delivers the shell, navigation and dashboard only. The schema behind this screen is already
          designed — see the architecture document. When phase {p.phase} runs, this screen gets:
        </p>
        <ul className="ph-list">
          {(p.builds ?? []).map((b) => (
            <li key={b}>
              <Icon name="check" size={15} color="var(--court-500)" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
