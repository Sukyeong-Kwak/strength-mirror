import { renderToBuffer } from "@react-pdf/renderer";

import { getPersonReportData } from "@/lib/data/reports";
import { PersonReport } from "@/lib/pdf/PersonReport";
import { registerFonts } from "@/lib/pdf/parts";
import { pdfResponse, reportFileName } from "@/lib/pdf/respond";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 한 사람의 강점 리포트 PDF.
 *
 * 결과 화면처럼 누구의 것이든 받을 수 있다. 화면에서 이미 보이는 것만 담는다.
 * 숨긴 사람은 화면과 똑같이 404 다. 견주기는 그 사람의 그룹 안에서만 한다.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const data = await getPersonReportData(id);
  if (data === null) {
    return new Response("Not found", { status: 404 });
  }

  registerFonts();
  const buffer = await renderToBuffer(<PersonReport data={data} />);
  // 파일 이름에 그 사람 이름을 넣는다. 여러 사람 것을 받아도 헷갈리지 않게
  return pdfResponse(
    buffer,
    reportFileName(data.name),
    `strength-report-${id.slice(0, 8)}.pdf`,
  );
}
