/**
 * 예시 그룹 안내 띠.
 *
 * 예시 인물을 실제 사람으로 착각하고 진지하게 글을 남기는 일이 없게,
 * 예시 그룹의 참여자 화면 맨 위에 늘 보이게 둔다.
 * 그룹 화면(/e/<slug>)과 개인 화면(/p/<id>)의 레이아웃이 예시 그룹일 때만 그린다.
 */
export function DemoBanner() {
  return (
    <div className="border-b border-line bg-warn-surface px-4 py-2 text-center text-sm text-warn">
      지금은 예시 화면이에요. 마음껏 눌러보세요 — 여기 남긴 글은 실제 결과에 들어가지 않아요.
    </div>
  );
}
