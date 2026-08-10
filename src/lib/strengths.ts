/**
 * VIA 24가지 강점과 6가지 덕목.
 *
 * 화면에 쓰이는 설명 문구의 원본은 이 파일이다.
 * DB 의 strengths.description 은 참고용이며, 문구를 고칠 때 마이그레이션이
 * 필요 없도록 화면은 항상 이 상수를 쓴다.
 *
 * 타입은 상수에서 파생시켜 오타가 컴파일 에러가 되게 한다.
 */

export const VIRTUES = [
  "wisdom",
  "courage",
  "humanity",
  "justice",
  "temperance",
  "transcendence",
] as const;

export type VirtueCode = (typeof VIRTUES)[number];

export type StrengthDef = {
  code: string;
  nameKo: string;
  nameEn: string;
  virtue: VirtueCode;
  order: number;
  /** 선택 칩 아래 서브텍스트. 한 줄 */
  short: string;
  /** 설명 시트 본문. 2~3문장 */
  long: string;
  /** "이런 모습이 보이면" 예시 한 문장 */
  example: string;
  /** 헷갈리기 쉬운 강점 코드 */
  confusableWith: readonly string[];
};

export const STRENGTHS = [
  {
    code: "creativity",
    nameKo: "창의성",
    nameEn: "Creativity",
    virtue: "wisdom",
    order: 1,
    short: "새롭고 더 나은 방법을 떠올려요",
    long: "익숙한 방식에 머물지 않고 다른 길을 상상해내는 힘이에요. 예술적인 재능만 뜻하는 게 아니라, 일상의 문제를 남다른 방식으로 푸는 것도 모두 창의성이에요.",
    example: '다들 막혔을 때 "이렇게 해보면 어때?" 하고 새로운 방법을 꺼낸다',
    confusableWith: ["curiosity"],
  },
  {
    code: "curiosity",
    nameKo: "호기심",
    nameEn: "Curiosity",
    virtue: "wisdom",
    order: 2,
    short: "모르는 걸 그냥 지나치지 않아요",
    long: "세상에 관심이 많고 질문이 많아요. 새로운 경험을 부담스러워하기보다 흥미로워하고, 익숙한 것에서도 궁금한 점을 찾아내요.",
    example: '처음 보는 것에 "이게 뭐예요?" 하고 먼저 물어본다',
    confusableWith: ["love_of_learning"],
  },
  {
    code: "judgment",
    nameKo: "판단력",
    nameEn: "Judgment",
    virtue: "wisdom",
    order: 3,
    short: "성급하게 결론 내지 않아요",
    long: "여러 각도에서 살펴보고 근거를 따져본 뒤에 판단해요. 자기 생각과 반대되는 이야기도 일단 들어보는 열린 마음이 여기에 포함돼요.",
    example: "한쪽 말만 듣고 결정하지 않고 반대편 이야기도 들어본다",
    confusableWith: ["prudence"],
  },
  {
    code: "love_of_learning",
    nameKo: "학구열",
    nameEn: "Love of Learning",
    virtue: "wisdom",
    order: 4,
    short: "배우는 것 자체를 즐겨요",
    long: '시험이나 필요 때문이 아니라, 아는 것이 늘어나는 즐거움으로 배워요. 호기심이 "알고 싶다"에 가깝다면 학구열은 "깊이 파고든다"에 가까워요.',
    example: "관심이 생긴 분야를 혼자서도 계속 찾아보고 파고든다",
    confusableWith: ["curiosity"],
  },
  {
    code: "perspective",
    nameKo: "통찰력",
    nameEn: "Perspective",
    virtue: "wisdom",
    order: 5,
    short: "큰 그림으로 조언해줘요",
    long: "아는 것이 많은 것과는 조금 달라요. 상황 전체를 넓게 보고, 다른 사람이 자기 문제를 이해하도록 도와주는 지혜예요. 사람들이 자연스럽게 조언을 구하러 찾아가는 사람이죠.",
    example: "고민을 털어놓으면 상황을 정리해주고 방향을 짚어준다",
    confusableWith: [],
  },
  {
    code: "bravery",
    nameKo: "용감함",
    nameEn: "Bravery",
    virtue: "courage",
    order: 6,
    short: "두려워도 옳은 일을 해요",
    long: "무섭지 않은 게 아니라, 무서워도 물러서지 않는 거예요. 위험 앞에서의 용기뿐 아니라 반대 의견을 말하거나 불편한 진실을 꺼내는 것도 용감함이에요.",
    example: "다들 눈치를 볼 때 혼자서라도 아니라고 말한다",
    confusableWith: ["honesty"],
  },
  {
    code: "perseverance",
    nameKo: "끈기",
    nameEn: "Perseverance",
    virtue: "courage",
    order: 7,
    short: "시작한 일을 끝까지 해내요",
    long: "중간에 힘들어지거나 지루해져도 마무리를 짓는 힘이에요. 걸림돌이 생겨도 계속 나아가고, 해냈을 때 그 기쁨을 알아요.",
    example: "티 나지 않는 일도 끝까지 붙잡고 마무리한다",
    confusableWith: [],
  },
  {
    code: "honesty",
    nameKo: "정직",
    nameEn: "Honesty",
    virtue: "courage",
    order: 8,
    short: "꾸미지 않고 진실하게 말해요",
    long: "거짓말을 하지 않는 것을 넘어, 자기 자신을 있는 그대로 드러내는 태도예요. 말과 행동이 같고 겉과 속이 다르지 않은 사람이죠.",
    example: "듣기 좋은 말 대신 사실대로 이야기해준다",
    confusableWith: ["bravery"],
  },
  {
    code: "zest",
    nameKo: "활력",
    nameEn: "Zest",
    virtue: "courage",
    order: 9,
    short: "에너지가 있고 함께 있으면 신나요",
    long: "무슨 일이든 대충 하지 않고 온몸으로 뛰어들어요. 그 사람이 있으면 자리의 공기가 달라지는, 그런 생기예요.",
    example: "그 사람이 오면 분위기가 확 살아난다",
    confusableWith: ["hope"],
  },
  {
    code: "love",
    nameKo: "사랑",
    nameEn: "Love",
    virtue: "humanity",
    order: 10,
    short: "가까운 사람과 깊이 이어져요",
    long: "사람과 가까워지는 것을 소중히 여기는 마음이에요. 주는 것뿐 아니라 받는 것도 편안하게 할 줄 아는 것까지 포함돼요.",
    example: "곁에 있는 사람을 꾸준히 챙기고 관계를 오래 이어간다",
    confusableWith: ["kindness"],
  },
  {
    code: "kindness",
    nameKo: "친절",
    nameEn: "Kindness",
    virtue: "humanity",
    order: 11,
    short: "먼저 챙기고 베풀어요",
    long: "부탁받지 않아도 다른 사람을 위해 움직이는 마음이에요. 돌아올 것을 기대하지 않고, 잘 모르는 사람에게도 마음을 열어둬요.",
    example: "처음 온 사람에게 먼저 다가가 말을 걸어준다",
    confusableWith: ["love"],
  },
  {
    code: "social_intelligence",
    nameKo: "사회지능",
    nameEn: "Social Intelligence",
    virtue: "humanity",
    order: 12,
    short: "분위기와 마음을 잘 읽어요",
    long: "자기 감정과 다른 사람의 감정을 빠르게 알아차리고, 어떤 상황에서 어떻게 행동해야 할지 아는 감각이에요.",
    example: '말하지 않아도 표정만 보고 "무슨 일 있어?" 하고 알아챈다',
    confusableWith: [],
  },
  {
    code: "teamwork",
    nameKo: "협동심",
    nameEn: "Teamwork",
    virtue: "justice",
    order: 13,
    short: "함께할 때 더 잘해요",
    long: "자기 몫을 충실히 하면서 팀 전체를 생각해요. 눈에 띄지 않는 자리에서도 성실하고, 속한 공동체에 충실한 힘이에요.",
    example: "티 나지 않는 궂은일을 말없이 맡아서 한다",
    confusableWith: ["leadership"],
  },
  {
    code: "fairness",
    nameKo: "공정성",
    nameEn: "Fairness",
    virtue: "justice",
    order: 14,
    short: "모두를 똑같이 대해요",
    long: "친하다고 봐주거나 개인적인 감정으로 사람을 다르게 대하지 않아요. 모두에게 같은 기회가 돌아가는지 살피는 마음이에요.",
    example: "친분과 상관없이 같은 기준으로 대한다",
    confusableWith: [],
  },
  {
    code: "leadership",
    nameKo: "리더십",
    nameEn: "Leadership",
    virtue: "justice",
    order: 15,
    short: "사람들을 모으고 이끌어요",
    long: "앞에서 지시하는 것보다, 함께 잘 굴러가게 만드는 힘에 가까워요. 사람들 사이의 관계를 좋게 유지하면서 일이 되게 해요.",
    example: "일이 흩어질 때 정리해서 모두가 움직이게 만든다",
    confusableWith: ["teamwork"],
  },
  {
    code: "forgiveness",
    nameKo: "용서",
    nameEn: "Forgiveness",
    virtue: "temperance",
    order: 16,
    short: "잘못을 오래 담아두지 않아요",
    long: "상처받은 일을 넘어가고 다시 기회를 주는 마음이에요. 되갚는 것보다 관계를 회복하는 쪽을 택해요.",
    example: "서운했던 일을 붙잡지 않고 먼저 풀고 지나간다",
    confusableWith: [],
  },
  {
    code: "humility",
    nameKo: "겸손",
    nameEn: "Humility",
    virtue: "temperance",
    order: 17,
    short: "굳이 드러내지 않아요",
    long: "자기를 낮추는 게 아니라, 자기를 부풀리지 않는 거예요. 잘한 일이 있어도 스스로 말하기보다 결과가 말하게 두는 태도죠.",
    example: "칭찬받을 일을 해놓고도 자기 자랑을 하지 않는다",
    confusableWith: [],
  },
  {
    code: "prudence",
    nameKo: "신중함",
    nameEn: "Prudence",
    virtue: "temperance",
    order: 18,
    short: "나중을 생각하고 선택해요",
    long: "소심한 것과는 달라요. 나중에 후회할 말이나 행동을 미리 걸러내는 분별력이에요.",
    example: "충동적으로 말하기 전에 한 번 더 생각한다",
    confusableWith: ["judgment"],
  },
  {
    code: "self_regulation",
    nameKo: "자기조절",
    nameEn: "Self-Regulation",
    virtue: "temperance",
    order: 19,
    short: "감정과 습관을 스스로 다스려요",
    long: "화가 나거나 하고 싶은 것이 있어도 스스로를 붙잡을 수 있는 힘이에요. 정해둔 것을 꾸준히 지켜내는 것도 여기에 들어가요.",
    example: "화날 상황에서도 감정을 가라앉히고 차분히 대응한다",
    confusableWith: ["prudence"],
  },
  {
    code: "appreciation_of_beauty",
    nameKo: "감상력",
    nameEn: "Appreciation of Beauty & Excellence",
    virtue: "transcendence",
    order: 20,
    short: "좋은 것을 알아보고 감탄해요",
    long: "자연이든 예술이든 사람의 훌륭함이든, 그 앞에서 잠시 멈춰 서서 감동할 줄 아는 마음이에요.",
    example: "지나칠 법한 풍경이나 남이 잘한 점을 알아보고 감탄한다",
    confusableWith: ["gratitude"],
  },
  {
    code: "gratitude",
    nameKo: "감사",
    nameEn: "Gratitude",
    virtue: "transcendence",
    order: 21,
    short: "고마움을 알고 표현해요",
    long: "좋은 일을 당연하게 여기지 않고 알아차려요. 마음에만 담아두지 않고 말로 전하는 것까지가 감사예요.",
    example: "작은 도움에도 꼭 고맙다고 말해준다",
    confusableWith: ["appreciation_of_beauty"],
  },
  {
    code: "hope",
    nameKo: "희망",
    nameEn: "Hope",
    virtue: "transcendence",
    order: 22,
    short: "잘될 거라 믿고 나아가요",
    long: "막연한 낙관이 아니라, 좋은 미래를 기대하고 그렇게 되도록 움직이는 힘이에요. 곁에 있는 사람까지 덩달아 기운이 나게 해요.",
    example: '상황이 어려울 때도 "괜찮아질 거야" 하며 방향을 본다',
    confusableWith: ["zest"],
  },
  {
    code: "humor",
    nameKo: "유머",
    nameEn: "Humor",
    virtue: "transcendence",
    order: 23,
    short: "웃음을 만들어줘요",
    long: "장난기만 뜻하는 게 아니에요. 무거운 상황을 가볍게 만들어 사람들을 편안하게 해주는 능력이에요.",
    example: "긴장된 분위기를 한마디로 풀어준다",
    confusableWith: [],
  },
  {
    code: "spirituality",
    nameKo: "영성",
    nameEn: "Spirituality",
    virtue: "transcendence",
    order: 24,
    short: "삶의 의미와 더 큰 것을 생각해요",
    long: "종교적인 믿음일 수도 있고, 삶이 어디로 향하는지에 대한 나름의 확신일 수도 있어요. 자기 삶을 더 큰 이야기 안에서 바라보는 태도예요.",
    example: "눈앞의 일보다 왜 그렇게 사는지를 늘 붙들고 있다",
    confusableWith: [],
  },
] as const satisfies readonly StrengthDef[];

export type StrengthCode = (typeof STRENGTHS)[number]["code"];

/**
 * confusableWith 에 존재하지 않는 코드를 적으면 여기서 컴파일 에러가 난다.
 * 타입 전용이므로 런타임 비용이 없다.
 */
type AssertExtends<T extends U, U> = T;
export type ConfusableCodesAreValid = AssertExtends<
  (typeof STRENGTHS)[number]["confusableWith"][number],
  StrengthCode
>;

export type VirtueMeta = {
  nameKo: string;
  nameEn: string;
  /** 막대·세로 인디케이터용 배경 클래스 */
  barClass: string;
  /**
   * 칩·뱃지용 (배경 + 글자색 + 경계선).
   * 색을 채우고 흰 글자를 얹으면 절제처럼 대비가 2.9:1 밖에 안 나오는 색이 생긴다.
   * 그래서 흰 배경에 진한 색 글자와 색 경계선으로 간다.
   */
  chipClass: string;
  /** 덕목명 텍스트 색. 막대 색이 아니라 글자용(-ink) 을 쓴다 */
  textClass: string;
  order: number;
};

/**
 * Tailwind JIT 는 소스에 문자열로 등장하는 클래스만 만들어낸다.
 * 그래서 `bg-virtue-${code}` 같은 조합을 쓰지 않고 완전한 클래스명을 박아둔다.
 */
export const VIRTUE_META: Record<VirtueCode, VirtueMeta> = {
  wisdom: {
    nameKo: "지혜와 지식",
    nameEn: "Wisdom & Knowledge",
    barClass: "bg-virtue-wisdom",
    chipClass: "bg-surface text-virtue-wisdom-ink border-virtue-wisdom",
    textClass: "text-virtue-wisdom-ink",
    order: 1,
  },
  courage: {
    nameKo: "용기",
    nameEn: "Courage",
    barClass: "bg-virtue-courage",
    chipClass: "bg-surface text-virtue-courage-ink border-virtue-courage",
    textClass: "text-virtue-courage-ink",
    order: 2,
  },
  humanity: {
    nameKo: "인간애",
    nameEn: "Humanity",
    barClass: "bg-virtue-humanity",
    chipClass: "bg-surface text-virtue-humanity-ink border-virtue-humanity",
    textClass: "text-virtue-humanity-ink",
    order: 3,
  },
  justice: {
    nameKo: "정의",
    nameEn: "Justice",
    barClass: "bg-virtue-justice",
    chipClass: "bg-surface text-virtue-justice-ink border-virtue-justice",
    textClass: "text-virtue-justice-ink",
    order: 4,
  },
  temperance: {
    nameKo: "절제",
    nameEn: "Temperance",
    barClass: "bg-virtue-temperance",
    chipClass: "bg-surface text-virtue-temperance-ink border-virtue-temperance",
    textClass: "text-virtue-temperance-ink",
    order: 5,
  },
  transcendence: {
    nameKo: "초월",
    nameEn: "Transcendence",
    barClass: "bg-virtue-transcendence",
    chipClass: "bg-surface text-virtue-transcendence-ink border-virtue-transcendence",
    textClass: "text-virtue-transcendence-ink",
    order: 6,
  },
};

const STRENGTH_BY_CODE: ReadonlyMap<string, StrengthDef> = new Map(
  STRENGTHS.map((s) => [s.code, s]),
);

export function isVirtueCode(value: unknown): value is VirtueCode {
  return typeof value === "string" && VIRTUES.some((v) => v === value);
}

export function isStrengthCode(value: unknown): value is StrengthCode {
  return typeof value === "string" && STRENGTH_BY_CODE.has(value);
}

/** 코드로 강점 정의를 찾는다. 없으면 null */
export function findStrength(code: string): StrengthDef | null {
  return STRENGTH_BY_CODE.get(code) ?? null;
}

/** 코드가 유효하다고 이미 아는 자리에서 쓴다 */
export function getStrength(code: StrengthCode): StrengthDef {
  const found = STRENGTH_BY_CODE.get(code);
  if (!found) {
    throw new Error(`unknown strength code: ${code}`);
  }
  return found;
}

/** 덕목 순서 → 강점 순서로 정렬된 덕목별 묶음 */
export const STRENGTHS_BY_VIRTUE: ReadonlyArray<{
  virtue: VirtueCode;
  meta: VirtueMeta;
  strengths: readonly StrengthDef[];
}> = VIRTUES.map((virtue) => ({
  virtue,
  meta: VIRTUE_META[virtue],
  strengths: STRENGTHS.filter((s) => s.virtue === virtue),
}));
