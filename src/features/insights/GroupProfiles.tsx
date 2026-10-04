import Link from "next/link";

import type { GroupProfile } from "@/lib/insights";
import { STRENGTHS, VIRTUE_META, getStrength } from "@/lib/strengths";

type GroupProfilesProps = {
  profiles: readonly GroupProfile[];
  hrefFor: (groupName: string) => string;
};

/**
 * 조마다의 결.
 *
 * 순위를 매기지 않는다. 조 사이에 누가 더 많이 받았는지를 보여주면
 * 놀이가 시합이 된다. 대신 조마다 어떤 색인지만 나란히 둔다.
 */
export function GroupProfiles({ profiles, hrefFor }: GroupProfilesProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {profiles.map((profile) => {
        const meta = profile.topVirtue === null ? null : VIRTUE_META[profile.topVirtue];
        return (
          <li key={profile.groupName}>
            <Link
              href={hrefFor(profile.groupName)}
              className="block h-full rounded-base border border-line bg-surface p-4"
              style={meta === null ? undefined : { borderTopColor: `var(${meta.colorVar})`, borderTopWidth: 4 }}
            >
              <span className="font-display text-lg">{profile.groupName}</span>
              {meta !== null && (
                <span className={`mt-1 block text-sm ${meta.textClass}`}>
                  {meta.nameKo} 쪽이 <span className="num">{profile.topVirtueRatio}%</span>
                </span>
              )}
              <span className="mt-2 block text-sm text-muted">
                많이 주신 강점 ·{" "}
                <span className="text-ink">
                  {profile.top.map((code) => getStrength(code).nameKo).join(", ")}
                </span>
              </span>
              {profile.distinctive !== null && (
                <span className="mt-1 block text-sm text-muted">
                  이 조에서 유독 ·{" "}
                  <span className="text-ink">{getStrength(profile.distinctive).nameKo}</span>
                </span>
              )}
              <span className="num mt-1 block text-sm text-muted">
                {STRENGTHS.length}가지 중 {profile.covered}가지를 함께 채웠어요
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
