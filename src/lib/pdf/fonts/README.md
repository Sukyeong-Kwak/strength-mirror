# PDF 서체

PDF 리포트(`src/lib/pdf`)에 심는 서체. 화면 서체(`src/lib/fonts.ts`)와 같은 조합이다.

| 파일 | 쓰임 | 출처 | 라이선스 |
|---|---|---|---|
| `DoHyeon-Regular.ttf` | 제목 · 사람과 강점 이름 | google/fonts `ofl/dohyeon` | SIL OFL 1.1 (`OFL-DoHyeon.txt`) |
| `Pretendard-Regular.ttf` · `Pretendard-Bold.ttf` | 본문 | npm `pretendard@1.3.9` `dist/public/static/alternative` | SIL OFL 1.1 |

화면은 가변 woff2 를 쓰지만 PDF 라이브러리는 woff2 · 가변 폰트를 읽지 못해 정적 TTF 를 따로 둔다.
PDF 에는 쓰인 글자만 잘라 넣으므로 파일이 커지지 않는다.
