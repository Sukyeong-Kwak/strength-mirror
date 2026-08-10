import { notFound } from "next/navigation";
import {
  Bagel_Fat_One,
  Black_Han_Sans,
  Do_Hyeon,
  Dongle,
  Gasoek_One,
  Gothic_A1,
  Gowun_Dodum,
  IBM_Plex_Sans_KR,
  Jua,
  Sunflower,
} from "next/font/google";

/**
 * 글씨체 고르는 임시 화면.
 *
 * 터미널에서는 글씨 모양을 볼 수 없어서, 직접 보고 고르시라고 만들었다.
 * 명조(고운바탕·나눔명조·Hahmlet 등)는 취향이 아니라고 하셔서 넣지 않았다.
 *
 * 고른 뒤에는 이 폴더를 지운다. 배포에는 나가지 않는다 (아래 notFound).
 */

// next/font 는 인자를 빌드 시점에 정적으로 읽는다.
// 공통 객체를 만들어 spread 하면 읽지 못하므로 하나씩 풀어 쓴다.
const jua = Jua({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const doHyeon = Do_Hyeon({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const blackHanSans = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const gasoekOne = Gasoek_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const bagelFatOne = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
const gothicA1 = Gothic_A1({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
  preload: false,
});
const plexKr = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});
const dongle = Dongle({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});
// Sunflower 는 subset 이 정의돼 있지 않아 subsets·preload 를 받지 않는다
const sunflower = Sunflower({ weight: ["500", "700"], display: "swap" });

type Candidate = {
  id: string;
  name: string;
  /** 어떤 성격인지 한 줄 */
  note: string;
  className: string;
  /** 제목에 쓸 굵기 */
  titleWeight: number;
  /** 이름에 쓸 굵기 */
  nameWeight: number;
};

const CANDIDATES: Candidate[] = [
  {
    id: "do-hyeon",
    name: "배민 도현체",
    note: "간판체. 단단하고 시원하다. 처음 고르셨던 것",
    className: doHyeon.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "jua",
    name: "배민 주아체",
    note: "동글동글한 붓글씨 느낌. 친근하고 따뜻하다",
    className: jua.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "black-han-sans",
    name: "Black Han Sans (한나체 계열)",
    note: "아주 굵고 좁다. 임팩트가 가장 크다",
    className: blackHanSans.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "gasoek-one",
    name: "가석 원",
    note: "묵직하고 둥글넓적하다. 요즘 포스터에서 자주 보인다",
    className: gasoekOne.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "bagel-fat-one",
    name: "베이글 팻 원",
    note: "통통하고 장난기 있다. 가장 캐주얼하다",
    className: bagelFatOne.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "gothic-a1",
    name: "고딕 A1",
    note: "요즘 고딕. 굵기가 9단계라 위계를 만들기 좋다",
    className: gothicA1.className,
    titleWeight: 800,
    nameWeight: 600,
  },
  {
    id: "plex-kr",
    name: "IBM Plex Sans KR",
    note: "요즘 고딕. 반듯하고 깔끔하다. 제품 화면에 잘 맞는다",
    className: plexKr.className,
    titleWeight: 600,
    nameWeight: 500,
  },
  {
    id: "gowun-dodum",
    name: "고운돋움",
    note: "부드럽고 동글한 고딕. 조용한 편",
    className: gowunDodum.className,
    titleWeight: 400,
    nameWeight: 400,
  },
  {
    id: "sunflower",
    name: "Sunflower",
    note: "기하학적이고 반듯한 고딕",
    className: sunflower.className,
    titleWeight: 700,
    nameWeight: 500,
  },
  {
    id: "dongle",
    name: "동글",
    note: "아주 동글하고 가볍다. 글자가 작게 나와서 크게 써야 한다",
    className: dongle.className,
    titleWeight: 700,
    nameWeight: 400,
  },
  {
    id: "none",
    name: "따로 안 씀 (Pretendard)",
    note: "본문과 같은 글씨체. 가장 깔끔하고 조용하다",
    className: "",
    titleWeight: 700,
    nameWeight: 600,
  },
];

/** 실제 화면과 같은 재료로 보여준다. 글씨만 바뀐다 */
function Sample({ candidate }: { candidate: Candidate }) {
  const { className, titleWeight, nameWeight } = candidate;

  return (
    <section className="rounded-base border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <p className="text-sm text-muted">{candidate.name}</p>
        <code className="rounded-base bg-page px-2 py-1 text-sm">{candidate.id}</code>
      </div>
      <p className="mt-2 text-sm text-muted">{candidate.note}</p>

      {/* 화면 제목 */}
      <p
        className={`mt-4 text-2xl ${className}`}
        style={{ fontWeight: titleWeight, letterSpacing: "-0.01em" }}
      >
        강점 발굴
      </p>
      <p
        className={`mt-1 text-2xl ${className}`}
        style={{ fontWeight: titleWeight, letterSpacing: "-0.01em" }}
      >
        수경님이 받은 강점
      </p>

      {/* 사람 이름 — 목록에서 */}
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {["김수경", "이영희", "박철수"].map((name, index) => (
          <li key={name} className="flex items-center justify-between py-2">
            <span className={`text-base ${className}`} style={{ fontWeight: nameWeight }}>
              {name}
            </span>
            <span className="num text-sm text-muted">{index + 1}조</span>
          </li>
        ))}
      </ul>

      {/* 강점 이름 + 막대 */}
      <div className="mt-4 space-y-2">
        {[
          { label: "창의성", ratio: 35, color: "var(--color-virtue-wisdom)" },
          { label: "용감함", ratio: 30, color: "var(--color-virtue-courage)" },
          { label: "친절", ratio: 20, color: "var(--color-virtue-humanity)" },
          { label: "협동심", ratio: 15, color: "var(--color-virtue-justice)" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-base ${className}`}
                style={{ fontWeight: nameWeight }}
              >
                {row.label}
              </span>
              <span className="num text-sm text-muted">{row.ratio}%</span>
            </div>
            <div className="mt-1 h-2 rounded-base bg-page">
              <div
                className="h-2 rounded-base"
                style={{ width: `${row.ratio}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 사유 — 본문은 언제나 Pretendard 다 */}
      <p className="mt-4 border-t border-line pt-3 text-sm">
        회의가 막힐 때마다 아무도 생각 못 한 방향을 꺼내줘서 매번 놀라요.
      </p>
    </section>
  );
}

export default function FontsPreviewPage() {
  // 배포에는 나가지 않는다. 지우는 것을 잊어도 안전하도록
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl" style={{ fontFamily: "var(--font-sans)" }}>
        글씨체 고르기
      </h1>
      <p className="mt-2 text-sm text-muted">
        제목과 사람·강점 이름에 쓸 글씨체 후보예요. 본문과 숫자는 어느 쪽을 골라도
        Pretendard 그대로예요.
      </p>
      <p className="mt-2 text-sm text-muted">
        명조(고운바탕·나눔명조 같은 것)는 빼고 요즘 글씨체만 모았어요. 마음에 드는 것의
        회색 딱지에 적힌 이름을 알려주세요.
      </p>
      <p className="mt-2 text-sm text-muted">
        이 화면은 고르고 나면 지웁니다. 배포에는 나가지 않아요.
      </p>

      <div className="mt-8 space-y-6">
        {CANDIDATES.map((candidate) => (
          <Sample key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </main>
  );
}
