import { renderToBuffer } from "@react-pdf/renderer";

import { getOverallReportData } from "@/lib/data/reports";
import { OverallReport } from "@/lib/pdf/OverallReport";
import { registerFonts } from "@/lib/pdf/parts";
import { pdfResponse } from "@/lib/pdf/respond";

/** 모두의 강점 리포트 PDF. 모두의 강점 화면처럼 누구나 받을 수 있다 */
export async function GET() {
  const data = await getOverallReportData();

  registerFonts();
  const buffer = await renderToBuffer(<OverallReport data={data} />);
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  return pdfResponse(buffer, `모두의강점_${date}.pdf`, `all-strengths-${date}.pdf`);
}
