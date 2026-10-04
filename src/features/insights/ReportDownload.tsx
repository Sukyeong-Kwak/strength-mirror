import { buttonClass, type ButtonSize } from "@/components/Button";
import { reportFileName } from "@/lib/pdf/respond";

type ReportDownloadProps = {
  personId: string;
  /** 파일 이름에 넣는다 */
  name: string;
  size?: ButtonSize;
  variant?: "primary" | "secondary";
};

/**
 * 한 사람의 강점 리포트 PDF 받기.
 *
 * 누구의 것이든 그 사람 화면에서 바로 받는다. 내가 누구인지 고르지 않는다.
 */
export function ReportDownload({
  personId,
  name,
  size = "md",
  variant = "primary",
}: ReportDownloadProps) {
  return (
    // 파일 이름을 여기서도 준다. 서버도 같은 이름을 보내지만, 한글 이름을 못 읽는
    // 브라우저는 영문 예비 이름으로 저장하기 때문이다
    <a
      href={`/p/${personId}/report`}
      download={reportFileName(name)}
      aria-label={`${name}님의 강점 리포트 PDF로 받기`}
      className={buttonClass(variant, false, size)}
    >
      PDF로 받기
    </a>
  );
}
