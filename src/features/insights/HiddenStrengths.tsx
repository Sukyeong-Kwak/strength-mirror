import Link from "next/link";

import type { HiddenStrengths as Hidden } from "@/lib/insights";
import { VIRTUE_META, type StrengthDef } from "@/lib/strengths";

function StrengthChips({ items }: { items: readonly StrengthDef[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s.code}>
          <Link
            href={`/strengths/${s.code}`}
            className={`inline-flex min-h-9 items-center rounded-base border px-3 text-sm ${VIRTUE_META[s.virtue].chipClass}`}
          >
            {s.nameKo}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * 아직 숨은 강점.
 *
 * 없는 것을 탓하는 말이 되지 않게 한다. "다음엔 이런 모습도 찾아보자" 쪽이다.
 * 이름을 누르면 그 강점의 뜻풀이로 간다 — 무엇을 찾아야 할지 알아야 찾는다.
 */
export function HiddenStrengths({ hidden }: { hidden: Hidden }) {
  if (hidden.untouched.length === 0 && hidden.rare.length === 0) {
    return (
      <p className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
        스물네 가지가 모두 고르게 나왔어요. 숨은 강점이 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hidden.untouched.length > 0 && (
        <div>
          <p className="text-sm text-muted">
            아직 아무도 고르지 않았어요. 이런 모습을 본 적 있다면 남겨보세요.
          </p>
          <StrengthChips items={hidden.untouched} />
        </div>
      )}
      {hidden.rare.length > 0 && (
        <div>
          <p className="text-sm text-muted">드물게 나왔어요.</p>
          <StrengthChips items={hidden.rare} />
        </div>
      )}
    </div>
  );
}
