/**
 * PDF 를 내려받는 응답.
 *
 * 파일 이름에 한글을 쓰려면 filename* (RFC 5987) 이 필요하다.
 * 그걸 모르는 오래된 브라우저를 위해 영문 이름도 함께 준다.
 */
export function pdfResponse(buffer: Uint8Array, fileName: string, asciiName: string): Response {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      // 이름이 들어간 파일이다. 중간 캐시에 남기지 않는다
      "Cache-Control": "private, no-store",
    },
  });
}

/** 파일 이름에 쓸 수 없는 글자를 뺀다 */
export function safeFilePart(value: string): string {
  return value.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);
}

/** 개인 리포트 파일 이름. 화면의 받기 버튼과 서버 응답이 같은 이름을 쓴다 */
export function reportFileName(name: string): string {
  return `${safeFilePart(name)}_강점리포트.pdf`;
}
