type EmptyStateProps = {
  /** 상태를 설명하고 끝내지 말고, 다음 행동을 지시할 것 (6-6) */
  title: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div className="rounded-base border border-line bg-surface px-4 py-10 text-center">
      <p className="text-sm text-muted">{title}</p>
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}
