export type SectionLink = { id: string; label: string };

/**
 * 이 화면에서 볼 수 있는 것들.
 *
 * 긴 화면은 아래에 무엇이 있는지 내려가 보기 전에는 모른다. 몰라서 안 보는 일이
 * 없도록 맨 위에 목차를 펼쳐 둔다. 누르면 그 자리로 내려간다.
 */
export function SectionNav({ links }: { links: readonly SectionLink[] }) {
  if (links.length < 2) {
    return null;
  }
  return (
    <nav aria-label="이 화면에서 볼 수 있는 것" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 목차가 가리키는 한 덩어리. 제목과 한 줄 설명을 같은 모양으로 둔다 */
export function InsightSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="text-xl">{title}</h2>
      {description !== undefined && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
