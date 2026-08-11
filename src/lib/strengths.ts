/**
 * VIA 24가지 강점과 6가지 덕목.
 *
 * 화면에 쓰이는 설명 문구의 원본은 이 파일이다.
 * DB 의 strengths.description 은 참고용이며, 문구를 고칠 때 마이그레이션이
 * 필요 없도록 화면은 항상 이 상수를 쓴다.
 *
 * 타입은 상수에서 파생시켜 오타가 컴파일 에러가 되게 한다.
 *
 * 이름·차례·정의는 VIA Institute on Character 의 공식 분류
 * (viacharacter.org/character-strengths)와 국내에서 널리 쓰는 번역어
 * (표 1. Strengths Finder — VIA(24))에 맞췄다.
 *   - 덕목 차례: 지혜와 지식 → 용기 → 인간애 → 정의감 → 절제력 → 영성과 초월성
 *   - 강점 차례: 그 표에 실린 순서 그대로다. VIA 웹사이트는 덕목 안에서
 *     알파벳순으로 늘어놓지만, 여기서는 표의 차례를 따른다
 *
 * 다만 문장은 우리가 직접 쓴다. VIA 의 설명문은 저작물이라 옮겨 심지 않는다.
 * viaDefinition 은 공식 정의가 말하는 내용을 우리말로 옮긴 것이고,
 * long·short·examples 는 그 뜻을 우리 화면의 말투로 풀어 쓴 것이다.
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
  /** VIA 분류가 나란히 쓰는 다른 이름. 없을 수 있다 */
  alsoCalled: readonly string[];
  virtue: VirtueCode;
  order: number;
  /** 선택 칩 아래 서브텍스트. 한 줄 */
  short: string;
  /** 설명 시트 본문. 2~3문장 */
  long: string;
  /** VIA 분류가 정의하는 내용을 우리말 한두 문장으로 옮긴 것 */
  viaDefinition: string;
  /** "이런 모습이 보이면" 예시. 세 개 */
  examples: readonly string[];
  /**
   * 비슷해 보이는 강점과 무엇이 다른지 한 문장.
   * confusableWith 가 비어 있으면 흔한 오해를 대신 적는다
   */
  distinction: string;
  /** 헷갈리기 쉬운 강점 코드 */
  confusableWith: readonly string[];
};

export const STRENGTHS = [
  {
    code: "creativity",
    nameKo: "창의성",
    nameEn: "Creativity",
    alsoCalled: ["독창성", "기발함"],
    virtue: "wisdom",
    order: 1,
    short: "새롭고 쓸모 있는 방법을 떠올려요",
    long: "익숙한 방식에 머물지 않고 새로운 길을 생각해내요. 떠올리는 데서 그치지 않고 쓸 만한 결과로 이어지게 하죠. 예술적인 재능도 여기 들어가지만 거기에만 그치지 않아요.",
    viaDefinition:
      "무언가를 생각하고 해내는 데 새롭고 쓸모 있는 방식을 찾아내는 힘. 예술적인 성취를 포함하되 거기에 한정되지 않는다.",
    examples: [
      '다들 막혔을 때 "이렇게 해보면 어때?" 하고 새로운 방법을 꺼낸다',
      "남들이 그냥 지나친 불편을 쓰기 좋게 바꿔둔다",
      "정해진 틀이 없을 때 오히려 자기 방식을 만들어낸다",
    ],
    distinction: "호기심은 알고 싶어 하는 마음이고, 창의성은 없던 것을 만들어내는 쪽이에요.",
    confusableWith: ["curiosity"],
  },
  {
    code: "curiosity",
    nameKo: "호기심",
    nameEn: "Curiosity",
    alsoCalled: ["관심", "새로운 것 찾기"],
    virtue: "wisdom",
    order: 2,
    short: "모르는 걸 그냥 지나치지 않아요",
    long: "지금 겪는 일 자체를 흥미로워해요. 이런저런 주제를 매력적으로 여기고, 새로운 경험을 얻을 수 있는 자리를 스스로 찾아 나서죠.",
    viaDefinition:
      "지금 겪는 일 자체에 흥미를 느끼는 힘. 주제를 매력적으로 여기고 직접 찾아보고 알아낸다.",
    examples: [
      '처음 보는 것에 "이게 뭐예요?" 하고 먼저 물어본다',
      "낯선 자리에 가는 것을 부담스러워하기보다 재미있어한다",
      "늘 지나다니던 길에서도 새로 눈에 띄는 것을 찾아낸다",
    ],
    distinction: "호기심은 넓게 관심을 두는 쪽이고, 학구열은 하나를 깊이 파고드는 쪽이에요.",
    confusableWith: ["love_of_learning"],
  },
  {
    code: "judgment",
    nameKo: "판단력",
    nameEn: "Judgment",
    alsoCalled: ["비판적 사고", "열린 마음"],
    virtue: "wisdom",
    order: 3,
    short: "모든 면을 따져보고 결정해요",
    long: "여러 각도에서 살펴보고 성급하게 결론 내지 않아요. 근거가 나오면 자기 생각을 바꿀 수 있고, 자기 신념과 어긋나는 주장까지 공평하게 견주어 봐요.",
    viaDefinition:
      "모든 면을 따져 생각하고 성급히 결론 내지 않는 힘. 근거 앞에서 생각을 바꿀 줄 알고, 자기 신념과 부딪히는 주장도 공정하게 견준다.",
    examples: [
      "한쪽 말만 듣고 결정하지 않고 반대편 이야기도 들어본다",
      "자기가 틀렸다는 근거가 나오면 생각을 바꾼다",
      "그럴듯한 이야기라도 근거를 한 번 따져본다",
    ],
    distinction:
      "판단력은 무엇이 맞는지 가려내는 힘이고, 신중성은 지금 해도 되는지를 재는 힘이에요.",
    confusableWith: ["prudence"],
  },
  {
    code: "love_of_learning",
    nameKo: "학구열",
    nameEn: "Love of Learning",
    alsoCalled: [],
    virtue: "wisdom",
    order: 4,
    short: "배우는 것 자체를 즐겨요",
    long: "새로운 기술과 지식을 익히는 것을 좋아해요. 혼자서든 정식으로 배우든 아는 것을 차곡차곡 쌓아 올리고, 이미 아는 분야도 한 단계 더 깊이 파고들어요.",
    viaDefinition:
      "새로운 기술·주제·지식을 익히는 힘. 호기심과 이어져 있지만, 아는 것을 체계적으로 쌓아 올린다는 점에서 한 걸음 더 나아간다.",
    examples: [
      "관심이 생긴 분야를 혼자서도 계속 찾아보고 파고든다",
      "누가 시키지 않아도 배운 것을 정리하거나 남에게 설명해본다",
      "잘 모르는 이야기가 나오면 기초부터 다시 짚어본다",
    ],
    distinction:
      "호기심은 질문에서 끝나기도 하지만, 학구열은 배우는 시간을 실제로 들여요.",
    confusableWith: ["curiosity"],
  },
  {
    code: "perspective",
    nameKo: "통찰",
    nameEn: "Perspective",
    alsoCalled: ["지혜"],
    virtue: "wisdom",
    order: 5,
    short: "큰 그림으로 조언해줘요",
    long: "아는 것이 많은 것과는 조금 달라요. 여러 관점과 자기가 겪은 일을 함께 놓고 큰 그림을 짚어, 남에게 지혜로운 조언을 건네는 힘이에요. 사람들이 자연스럽게 찾아가는 사람이죠.",
    viaDefinition:
      "남에게 지혜로운 조언을 건네는 힘. 세상을 보는 자기 나름의 틀이 있고, 그 틀이 자기에게도 남에게도 말이 된다.",
    examples: [
      "고민을 털어놓으면 상황을 정리해주고 방향을 짚어준다",
      "어려운 일이 생기면 사람들이 먼저 그를 찾아간다",
      "지금 다투는 문제가 사실은 무엇 때문인지 짚어준다",
    ],
    distinction:
      "아는 것이 많다는 뜻이 아니에요. 지식의 양보다 상황 전체를 넓게 보는 눈에 가까워요.",
    confusableWith: [],
  },
  {
    code: "bravery",
    nameKo: "용감성",
    nameEn: "Bravery",
    alsoCalled: ["용맹"],
    virtue: "courage",
    order: 6,
    short: "두려워도 옳은 일을 해요",
    long: "위협·도전·어려움·고통 앞에서 물러서지 않아요. 반대하는 사람이 있어도 옳다고 믿는 바를 말하고, 인기가 없더라도 그대로 행동해요. 몸으로 부딪히는 용기도 포함하지만 거기에만 그치지 않아요.",
    viaDefinition:
      "위협·도전·어려움·고통 앞에서 움츠러들지 않는 힘. 반대가 있어도 옳은 것을 말하고 믿는 바대로 행동한다. 몸의 용기를 포함하되 거기에 한정되지 않는다.",
    examples: [
      "다들 눈치를 볼 때 혼자서라도 아니라고 말한다",
      "말하기 껄끄러운 문제를 먼저 꺼내 놓는다",
      "손해를 볼 수 있는 자리에서도 자기 입장을 지킨다",
    ],
    distinction:
      "진실성은 사실대로 말하는 것이고, 용감성은 그 말을 꺼내기 어려운 자리에서도 꺼내는 것이에요.",
    confusableWith: ["honesty"],
  },
  {
    code: "perseverance",
    nameKo: "끈기",
    nameEn: "Perseverance",
    alsoCalled: ["끈질김", "근면"],
    virtue: "courage",
    order: 7,
    short: "시작한 일을 끝까지 해내요",
    long: "시작한 일을 끝내요. 걸림돌이 생기거나 맥이 빠지는 일이 있어도 하던 길을 계속 가고, 마무리 짓는 데서 기쁨을 느껴요.",
    viaDefinition:
      "시작한 일을 끝내는 힘. 걸림돌·낙심·실망이 있어도 하던 일을 이어가고, 끝맺는 것 자체에서 즐거움을 느낀다.",
    examples: [
      "티 나지 않는 일도 끝까지 붙잡고 마무리한다",
      "지루해지는 구간에서도 손을 놓지 않는다",
      "한 번 막혔다고 그만두지 않고 다른 방법으로 다시 해본다",
    ],
    distinction:
      "고집스럽게 버틴다는 뜻이 아니에요. 하기로 한 것을 끝까지 데려간다는 뜻이에요.",
    confusableWith: [],
  },
  {
    code: "honesty",
    nameKo: "진실성",
    nameEn: "Honesty",
    alsoCalled: ["정직", "진정성"],
    virtue: "courage",
    order: 8,
    short: "꾸미지 않고 진실하게 말해요",
    long: "사실대로 말하는 것을 넘어, 자기를 있는 그대로 드러내고 진실하게 행동하는 태도예요. 겉을 꾸미지 않고, 자기 감정과 행동에 스스로 책임을 져요.",
    viaDefinition:
      "진실을 말하는 데서 나아가 자기를 있는 그대로 드러내고 진실하게 행동하는 힘. 꾸밈이 없고 자기 감정과 행동에 책임을 진다.",
    examples: [
      "듣기 좋은 말 대신 사실대로 이야기해준다",
      "자기 실수를 감추지 않고 먼저 말한다",
      "사람에 따라 말을 바꾸지 않는다",
    ],
    distinction:
      "용감성이 두려움을 넘어서는 힘이라면, 진실성은 겉과 속을 같게 두는 태도예요.",
    confusableWith: ["bravery"],
  },
  {
    code: "zest",
    nameKo: "활력",
    nameEn: "Zest",
    alsoCalled: ["생기", "열정"],
    virtue: "courage",
    order: 9,
    short: "에너지가 있고 함께 있으면 신나요",
    long: "설렘과 기운을 가지고 삶을 대해요. 무슨 일이든 반쯤 걸치거나 마지못해 하지 않고, 살아 있다는 감각으로 움직이죠. 그 사람이 있으면 자리의 공기가 달라져요.",
    viaDefinition:
      "설렘과 기운을 가지고 삶에 다가서는 힘. 무슨 일이든 반쯤 하거나 마음을 반만 쓰지 않고, 삶을 모험처럼 대하며 살아 있다고 느낀다.",
    examples: [
      "그 사람이 오면 분위기가 확 살아난다",
      "맡은 일을 대충 넘기지 않고 몸을 던져 한다",
      "지친 자리에서도 먼저 기운을 낸다",
    ],
    distinction: "희망은 앞날을 믿는 마음이고, 활력은 지금 이 자리에 쏟는 기운이에요.",
    confusableWith: ["hope"],
  },
  {
    code: "kindness",
    nameKo: "친절",
    nameEn: "Kindness",
    alsoCalled: ["너그러움", "보살핌", "연민"],
    virtue: "humanity",
    order: 10,
    short: "먼저 챙기고 베풀어요",
    long: "부탁받지 않아도 남에게 도움이 되는 일을 해요. 상대의 마음을 헤아리고, 돌아올 것을 기대하지 않고 챙기고 보살펴요.",
    viaDefinition:
      "남을 위해 좋은 일을 하고 도와주고 보살피는 힘. 대가를 바라지 않고 먼저 움직인다.",
    examples: [
      "처음 온 사람에게 먼저 다가가 말을 걸어준다",
      "부탁하지 않았는데 필요한 것을 챙겨둔다",
      "돌아올 것을 따지지 않고 도와준다",
    ],
    distinction:
      "사랑이 가까운 사람과 깊어지는 것이라면, 친절은 아는 사이가 아니어도 움직여요.",
    confusableWith: ["love"],
  },
  {
    code: "love",
    nameKo: "사랑",
    nameEn: "Love",
    alsoCalled: [],
    virtue: "humanity",
    order: 11,
    short: "가까운 사람과 깊이 이어져요",
    long: "사람과 가까이 지내는 것을 소중히 여겨요. 특히 마음을 주고받는 것이 서로 오가는 관계를 귀하게 여기죠. 주는 것뿐 아니라 받는 것도 편안하게 할 줄 알아요.",
    viaDefinition:
      "사람과 가까이 지내는 것을 소중히 여기는 힘. 특히 나누고 보살피는 일이 서로 오가는 관계를 귀하게 여긴다.",
    examples: [
      "곁에 있는 사람을 꾸준히 챙기고 관계를 오래 이어간다",
      "힘든 일이 있을 때 말없이 곁에 머물러준다",
      "도움을 주기만 하지 않고 받는 것도 편하게 한다",
    ],
    distinction:
      "친절은 누구에게나 베푸는 마음이고, 사랑은 가까운 사이를 깊게 이어가는 힘이에요.",
    confusableWith: ["kindness"],
  },
  {
    code: "social_intelligence",
    nameKo: "사회지능",
    nameEn: "Social Intelligence",
    alsoCalled: ["정서지능"],
    virtue: "humanity",
    order: 12,
    short: "분위기와 마음을 잘 읽어요",
    long: "자기와 다른 사람의 감정·속마음을 알아차려요. 자리마다 어떻게 처신해야 하는지 알고, 무엇이 그 사람을 움직이는지 짚어내죠.",
    viaDefinition:
      "자기와 남의 속내와 감정을 알아차리는 힘. 어떤 자리에 어떻게 어울려야 하는지 알고, 무엇이 사람을 움직이는지 안다.",
    examples: [
      '말하지 않아도 표정만 보고 "무슨 일 있어?" 하고 알아챈다',
      "어색한 자리에서 누구에게 말을 걸어야 할지 안다",
      "같은 말도 그 사람이 받아들이기 쉬운 방식으로 꺼낸다",
    ],
    distinction:
      "눈치가 빠르다는 말과는 달라요. 알아챈 것을 상대가 편해지는 쪽으로 쓰는 힘이에요.",
    confusableWith: [],
  },
  {
    code: "teamwork",
    nameKo: "협동심",
    nameEn: "Teamwork",
    alsoCalled: ["시민의식", "사회적 책임", "충실함"],
    virtue: "justice",
    order: 13,
    short: "함께할 때 더 잘해요",
    long: "무리의 한 사람으로서 제 몫을 다해요. 속한 곳에 충실하고, 팀이 목표에 닿도록 돕는 것을 자기 책임으로 여겨요. 눈에 띄지 않는 자리에서도 성실하죠.",
    viaDefinition:
      "무리나 팀의 한 사람으로 잘 해내는 힘. 속한 곳에 충실하고 제 몫을 한다.",
    examples: [
      "티 나지 않는 궂은일을 말없이 맡아서 한다",
      "자기 몫이 끝나도 남은 일을 같이 본다",
      "혼자 앞서가기보다 속도를 맞춘다",
    ],
    distinction:
      "리더십은 판을 만들어 굴러가게 하는 쪽이고, 협동심은 그 안에서 제 몫을 다하는 쪽이에요.",
    confusableWith: ["leadership"],
  },
  {
    code: "fairness",
    nameKo: "공정성",
    nameEn: "Fairness",
    alsoCalled: [],
    virtue: "justice",
    order: 14,
    short: "모두를 똑같이 대해요",
    long: "공정함이라는 기준에 따라 모두를 같게 대해요. 개인적인 감정이 판단을 기울이게 두지 않고, 누구에게나 같은 규칙과 같은 기회를 줘요.",
    viaDefinition:
      "공정함과 정의라는 기준에 따라 모두를 같게 대하는 힘. 개인적인 감정이 남에 대한 판단을 기울이게 두지 않고 누구에게나 같은 기회를 준다.",
    examples: [
      "친분과 상관없이 같은 기준으로 대한다",
      "말이 적은 사람의 몫도 챙겨서 물어본다",
      "자기에게 불리해도 정한 기준을 그대로 지킨다",
    ],
    distinction:
      "차갑게 원칙만 따진다는 뜻이 아니에요. 아무도 빠지지 않게 살피는 마음이에요.",
    confusableWith: [],
  },
  {
    code: "leadership",
    nameKo: "리더십",
    nameEn: "Leadership",
    alsoCalled: [],
    virtue: "justice",
    order: 15,
    short: "사람들을 모으고 이끌어요",
    long: "앞에서 지시하는 것보다, 함께 잘 굴러가게 만드는 힘에 가까워요. 할 일을 짜고 실제로 되게 만들면서, 그 안의 사이가 상하지 않게 지켜요.",
    viaDefinition:
      "자기가 속한 무리가 일을 해내도록 북돋우면서, 동시에 무리 안의 사이를 좋게 지키는 힘. 함께할 일을 짜고 그것이 실제로 일어나게 한다.",
    examples: [
      "일이 흩어질 때 정리해서 모두가 움직이게 만든다",
      "누가 무엇을 할지 막힐 때 먼저 정리해준다",
      "사이가 상하지 않게 하면서도 일이 되게 한다",
    ],
    distinction:
      "협동심이 함께 잘 해내는 힘이라면, 리더십은 그 판을 만들고 굴러가게 하는 힘이에요.",
    confusableWith: ["teamwork"],
  },
  {
    code: "forgiveness",
    nameKo: "용서",
    nameEn: "Forgiveness",
    alsoCalled: ["자비"],
    virtue: "temperance",
    order: 16,
    short: "잘못을 오래 담아두지 않아요",
    long: "잘못한 사람을 용서해요. 사람의 부족한 면을 받아들이고 다시 기회를 주며, 되갚으려는 마음을 담아두지 않아요.",
    viaDefinition:
      "잘못한 사람을 용서하는 힘. 남의 부족함을 받아들이고 다시 기회를 주며 앙갚음하지 않는다.",
    examples: [
      "서운했던 일을 붙잡지 않고 먼저 풀고 지나간다",
      "실수한 사람에게 다시 기회를 준다",
      "되갚기보다 관계를 되돌리는 쪽을 고른다",
    ],
    distinction:
      "참고 넘어간다는 뜻이 아니에요. 담아두지 않고 관계를 되살린다는 뜻이에요.",
    confusableWith: [],
  },
  {
    code: "humility",
    nameKo: "겸손",
    nameEn: "Humility",
    alsoCalled: ["겸양"],
    virtue: "temperance",
    order: 17,
    short: "굳이 드러내지 않아요",
    long: "자기를 낮추는 게 아니라, 자기를 부풀리지 않는 거예요. 해낸 일이 스스로 말하게 두고, 자기가 실제보다 특별하다고 여기지 않아요.",
    viaDefinition:
      "해낸 일이 스스로 말하게 두는 힘. 자기를 실제보다 특별하게 여기지 않고, 주목이나 인정을 좇지 않는다.",
    examples: [
      "칭찬받을 일을 해놓고도 자기 자랑을 하지 않는다",
      "모르는 것을 모른다고 말한다",
      "잘된 일에서 다른 사람의 몫을 먼저 이야기한다",
    ],
    distinction:
      "자기를 낮춰 말한다는 뜻이 아니에요. 있는 만큼만 보이게 둔다는 뜻이에요.",
    confusableWith: [],
  },
  {
    code: "prudence",
    nameKo: "신중성",
    nameEn: "Prudence",
    alsoCalled: [],
    virtue: "temperance",
    order: 18,
    short: "나중을 생각하고 선택해요",
    long: "소심한 것과는 달라요. 고를 때 조심스럽고, 굳이 지지 않아도 될 위험은 피하며, 나중에 후회할 말이나 행동을 미리 걸러내는 분별력이에요.",
    viaDefinition:
      "무엇을 고를지 조심스럽게 살피는 힘. 지나친 위험을 지지 않고, 나중에 후회할 말이나 행동을 하지 않는다.",
    examples: [
      "충동적으로 말하기 전에 한 번 더 생각한다",
      "나중에 문제가 될 만한 것을 미리 짚어둔다",
      "급하게 정하자는 자리에서 한 박자 늦춘다",
    ],
    distinction:
      "판단력은 무엇이 맞는지 가리는 힘이고, 신중성은 지금 해도 되는지를 재는 힘이에요.",
    confusableWith: ["judgment"],
  },
  {
    code: "self_regulation",
    nameKo: "자기통제력",
    nameEn: "Self-Regulation",
    alsoCalled: ["자기조절"],
    virtue: "temperance",
    order: 19,
    short: "감정과 습관을 스스로 다스려요",
    long: "느끼는 것과 하는 것을 스스로 다스려요. 화가 나거나 하고 싶은 것이 있어도 자기를 붙잡을 수 있고, 정해둔 것을 꾸준히 지켜내는 규율이 있어요.",
    viaDefinition:
      "자기가 느끼는 것과 하는 것을 다스리는 힘. 규율이 있고, 올라오는 욕구와 감정을 스스로 조절한다.",
    examples: [
      "화날 상황에서도 감정을 가라앉히고 차분히 대응한다",
      "하기로 정한 것을 기분과 상관없이 지킨다",
      "하고 싶은 것을 잠시 미뤄둘 줄 안다",
    ],
    distinction:
      "신중성은 하기 전에 재보는 힘이고, 자기통제력은 이미 올라온 마음을 다스리는 힘이에요.",
    confusableWith: ["prudence"],
  },
  {
    code: "appreciation_of_beauty",
    nameKo: "감상력",
    nameEn: "Appreciation of Beauty & Excellence",
    alsoCalled: ["경외", "경탄"],
    virtue: "transcendence",
    order: 20,
    short: "좋은 것을 알아보고 감탄해요",
    long: "삶의 여러 자리에서 아름다움과 뛰어남, 훌륭한 솜씨를 알아보고 마음으로 느껴요. 자연이든 예술이든 일상이든, 남이 잘해낸 것 앞에서 잠시 멈춰 설 줄 알아요.",
    viaDefinition:
      "삶의 여러 영역에서 아름다움·뛰어남·훌륭한 솜씨를 알아차리고 음미하는 힘. 자연에서 예술, 학문, 일상의 경험까지 어디에나 해당한다.",
    examples: [
      "지나칠 법한 풍경이나 남이 잘한 점을 알아보고 감탄한다",
      "좋은 것을 보면 그냥 지나치지 않고 오래 들여다본다",
      "남이 잘한 부분을 구체적으로 짚어 말해준다",
    ],
    distinction:
      "감사는 나에게 온 것에 고마워하는 마음이고, 감상력은 나와 상관없는 좋은 것에도 감탄하는 마음이에요.",
    confusableWith: ["gratitude"],
  },
  {
    code: "gratitude",
    nameKo: "감사",
    nameEn: "Gratitude",
    alsoCalled: [],
    virtue: "transcendence",
    order: 21,
    short: "고마움을 알고 표현해요",
    long: "좋은 일이 있으면 당연하게 여기지 않고 알아차려요. 마음에만 담아두지 않고 시간을 들여 고맙다고 전하는 것까지가 감사예요.",
    viaDefinition:
      "일어난 좋은 일을 알아차리고 고마워하는 힘. 시간을 내어 고마움을 말로 전한다.",
    examples: [
      "작은 도움에도 꼭 고맙다고 말해준다",
      "당연해 보이는 일에도 누구 덕분인지 짚는다",
      "고마운 마음을 미루지 않고 그때 전한다",
    ],
    distinction:
      "감상력이 좋은 것을 알아보는 눈이라면, 감사는 그것이 나에게 왔음을 알아보고 전하는 마음이에요.",
    confusableWith: ["appreciation_of_beauty"],
  },
  {
    code: "hope",
    nameKo: "희망",
    nameEn: "Hope",
    alsoCalled: ["낙관성", "미래지향"],
    virtue: "transcendence",
    order: 22,
    short: "잘될 거라 믿고 나아가요",
    long: "막연한 낙관이 아니에요. 앞날에 가장 좋은 것을 기대하면서 그렇게 되도록 실제로 애쓰고, 좋은 미래는 만들어낼 수 있는 것이라고 믿어요.",
    viaDefinition:
      "앞날에 가장 좋은 것을 기대하고 그렇게 되도록 애쓰는 힘. 좋은 미래는 이루어낼 수 있는 것이라고 믿는다.",
    examples: [
      '상황이 어려울 때도 "괜찮아질 거야" 하며 방향을 본다',
      "안 될 이유보다 될 방법을 먼저 찾는다",
      "지금 힘든 자리에서도 다음 걸음을 이야기한다",
    ],
    distinction:
      "활력이 지금 이 자리에 쏟는 기운이라면, 희망은 아직 오지 않은 날을 보는 마음이에요.",
    confusableWith: ["zest"],
  },
  {
    code: "humor",
    nameKo: "유머감각",
    nameEn: "Humor",
    alsoCalled: ["유쾌함"],
    virtue: "transcendence",
    order: 23,
    short: "웃음을 만들어줘요",
    long: "장난기만 뜻하는 게 아니에요. 삶을 유쾌하게 대하며 사람들을 웃게 만들고, 힘들고 팍팍한 때에도 웃을 구석을 찾아내는 힘이에요.",
    viaDefinition:
      "웃고 장난치기를 좋아하고 남에게 웃음을 가져다주는 힘. 상황의 가벼운 면을 볼 줄 안다.",
    examples: [
      "긴장된 분위기를 한마디로 풀어준다",
      "힘든 일을 이야기할 때도 웃을 구석을 찾아낸다",
      "누구를 깎아내리지 않고 웃게 만든다",
    ],
    distinction:
      "웃기는 사람이라는 뜻만은 아니에요. 무거운 자리를 견딜 만하게 만들어주는 힘이에요.",
    confusableWith: [],
  },
  {
    code: "spirituality",
    nameKo: "영성",
    nameEn: "Spirituality",
    alsoCalled: ["신앙", "목적의식"],
    virtue: "transcendence",
    order: 24,
    short: "삶의 의미와 더 큰 것을 생각해요",
    long: "종교적인 믿음일 수도 있고, 삶이 어디로 향하는지에 대한 나름의 확신일 수도 있어요. 더 큰 흐름 안에서 자기 자리를 보고, 일상에서 뜻을 찾는 태도예요.",
    viaDefinition:
      "삶에 더 높은 목적과 의미가 있다고 여기는 힘. 더 큰 흐름 안에서 자기 자리를 알고, 그 믿음이 행동을 이끌고 위로가 된다.",
    examples: [
      "눈앞의 일보다 왜 그렇게 사는지를 늘 붙들고 있다",
      "결정할 때 자기가 지키려는 것이 무엇인지부터 본다",
      "일이 잘 풀리든 아니든 그 안에서 뜻을 찾는다",
    ],
    distinction:
      "종교가 있어야 한다는 뜻이 아니에요. 자기 삶을 더 큰 이야기 안에서 본다는 뜻이에요.",
    confusableWith: [],
  },
] as const satisfies readonly StrengthDef[];

/**
 * STRENGTHS 의 한 항목.
 *
 * StrengthDef 와 달리 code 가 좁혀져 있다. 화면에서 고른 강점을 그대로
 * 제출에 쓰려면 code 가 string 이 아니라 StrengthCode 여야 한다.
 */
export type Strength = (typeof STRENGTHS)[number];

export type StrengthCode = Strength["code"];

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
   * 막대 색의 CSS 변수 이름.
   *
   * 히트맵은 같은 색을 흰색과 섞어 진하기를 24단으로 나눈다. 클래스로는
   * 그 조합을 미리 만들어 둘 수 없어 인라인 스타일로 색을 계산해야 하고,
   * 그때 색을 다시 적으면 팔레트가 두 곳으로 갈린다. 그래서 이름만 준다.
   */
  colorVar: string;
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
    colorVar: "--color-virtue-wisdom",
    chipClass: "bg-surface text-virtue-wisdom-ink border-virtue-wisdom",
    textClass: "text-virtue-wisdom-ink",
    order: 1,
  },
  courage: {
    nameKo: "용기",
    nameEn: "Courage",
    barClass: "bg-virtue-courage",
    colorVar: "--color-virtue-courage",
    chipClass: "bg-surface text-virtue-courage-ink border-virtue-courage",
    textClass: "text-virtue-courage-ink",
    order: 2,
  },
  humanity: {
    nameKo: "인간애",
    nameEn: "Humanity",
    barClass: "bg-virtue-humanity",
    colorVar: "--color-virtue-humanity",
    chipClass: "bg-surface text-virtue-humanity-ink border-virtue-humanity",
    textClass: "text-virtue-humanity-ink",
    order: 3,
  },
  justice: {
    nameKo: "정의감",
    nameEn: "Justice",
    barClass: "bg-virtue-justice",
    colorVar: "--color-virtue-justice",
    chipClass: "bg-surface text-virtue-justice-ink border-virtue-justice",
    textClass: "text-virtue-justice-ink",
    order: 4,
  },
  temperance: {
    nameKo: "절제력",
    nameEn: "Temperance",
    barClass: "bg-virtue-temperance",
    colorVar: "--color-virtue-temperance",
    chipClass: "bg-surface text-virtue-temperance-ink border-virtue-temperance",
    textClass: "text-virtue-temperance-ink",
    order: 5,
  },
  transcendence: {
    nameKo: "영성과 초월성",
    nameEn: "Transcendence",
    barClass: "bg-virtue-transcendence",
    colorVar: "--color-virtue-transcendence",
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
  strengths: readonly Strength[];
}> = VIRTUES.map((virtue) => ({
  virtue,
  meta: VIRTUE_META[virtue],
  strengths: STRENGTHS.filter((s) => s.virtue === virtue),
}));
