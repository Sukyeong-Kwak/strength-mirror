"use client";

import { useMemo } from "react";

import { buttonClass } from "@/components/Button";
import { encodeLens, lensFromSubmissions } from "@/lib/insights";
import { reportFileName } from "@/lib/pdf/respond";
import { useMe, useSubmissions } from "@/lib/useLocalStore";

type ReportDownloadProps = {
  personId: string;
  /** 파일 이름에 넣는다 */
  name: string;
  /** 지금 화면에 있는 사람들. 예시 화면에서 연습한 기록을 섞지 않으려고 쓴다 */
  personIds: readonly string[];
  size?: "md" | "lg";
};

/**
 * 내 강점 리포트 PDF 받기.
 *
 * 이 사람이 '내 이름' 으로 기억해둔 사람이면, 이 기기에만 있는
 * '내가 사람을 보는 눈' 을 주소에 실어 함께 보낸다. 누구에게 남겼는지는 빼고
 * 강점별 개수만 간다. 다른 사람의 리포트를 받을 때는 아무것도 싣지 않는다.
 */
export function ReportDownload({ personId, name, personIds, size = "md" }: ReportDownloadProps) {
  const me = useMe();
  const submissions = useSubmissions();

  const href = useMemo(() => {
    const base = `/p/${personId}/report`;
    if (me !== personId) {
      return base;
    }
    const ids = new Set(personIds);
    const lens = lensFromSubmissions(submissions.filter((row) => ids.has(row.personId)));
    if (lens.total === 0) {
      return base;
    }
    return `${base}?${new URLSearchParams(encodeLens(lens)).toString()}`;
  }, [me, personId, personIds, submissions]);

  return (
    // 파일 이름을 여기서도 준다. 서버도 같은 이름을 보내지만, 한글 이름을 못 읽는
    // 브라우저는 영문 예비 이름으로 저장하기 때문이다
    <a href={href} download={reportFileName(name)} className={buttonClass("primary", false, size)}>
      PDF로 받기
    </a>
  );
}
