import { renderToBuffer } from "@react-pdf/renderer";

import { getEventBySlug } from "@/lib/data/events";
import { getOverallReportData } from "@/lib/data/reports";
import { OverallReport } from "@/lib/pdf/OverallReport";
import { registerFonts } from "@/lib/pdf/parts";
import { pdfResponse, safeFilePart } from "@/lib/pdf/respond";

/** 그룹 모두의 강점 리포트 PDF. 모두의 강점 화면처럼 누구나 받을 수 있다 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (event === null) {
    return new Response("Not found", { status: 404 });
  }

  const data = await getOverallReportData(event);

  registerFonts();
  const buffer = await renderToBuffer(<OverallReport data={data} />);
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  // 여러 그룹 파일을 받아도 헷갈리지 않게 행사 제목을 붙인다
  return pdfResponse(
    buffer,
    `모두의강점_${safeFilePart(event.title)}_${date}.pdf`,
    `all-strengths-${event.slug}-${date}.pdf`,
  );
}
