/**
 * VIA 24가지 강점과 6가지 덕목.
 *
 * 화면에 쓰이는 설명 문구의 원본은 이 파일이다.
 * DB 의 strengths.description 은 참고용이며, 문구를 고칠 때 마이그레이션이
 * 필요 없도록 화면은 항상 이 상수를 쓴다.
 *
 * 타입은 상수에서 파생시켜 오타가 컴파일 에러가 되게 한다.
 *
 * 분류·영문 명칭·다른 이름·정의의 내용은 VIA Institute on Character 의
 * 공식 분류(viacharacter.org/character-strengths)와 대조해 맞췄다.
 * 다만 문장은 우리가 직접 쓴다. VIA 의 설명문은 저작물이라 옮겨 심지 않는다.
 *
 * short 와 long 은 명세 부록 A 원문이다. 손대지 않는다.
 * viaDefinition 아래는 이 파일에서 새로 쓴 것이라 고쳐도 된다.
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
  /** VIA 분류가 정의하는 내용을 우리말 한 문장으로 옮긴 것 */
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
    short: "새롭고 더 나은 방법을 떠올려요",
    long: "익숙한 방식에 머물지 않고 다른 길을 상상해내는 힘이에요. 예술적인 재능만 뜻하는 게 아니라, 일상의 문제를 남다른 방식으로 푸는 것도 모두 창의성이에요.",
    viaDefinition:
      "새롭고 쓸모 있는 방식으로 생각해내는 힘. 남다르기만 한 것이 아니라 실제로 도움이 되는지까지 포함한다.",
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
    long: "세상에 관심이 많고 질문이 많아요. 새로운 경험을 부담스러워하기보다 흥미로워하고, 익숙한 것에서도 궁금한 점을 찾아내요.",
    viaDefinition:
      "새로운 경험과 배울 거리를 스스로 찾아 나서는 힘. 애매한 상황을 견디지 못하기보다 흥미로워한다.",
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
    short: "성급하게 결론 내지 않아요",
    long: "여러 각도에서 살펴보고 근거를 따져본 뒤에 판단해요. 자기 생각과 반대되는 이야기도 일단 들어보는 열린 마음이 여기에 포함돼요.",
    viaDefinition:
      "여러 관점을 치우침 없이 견주어 보고 결정하는 힘. 결론을 미리 정해두고 근거를 모으지 않는다.",
    examples: [
      "한쪽 말만 듣고 결정하지 않고 반대편 이야기도 들어본다",
      "자기가 틀렸다는 근거가 나오면 생각을 바꾼다",
      "그럴듯한 이야기라도 근거를 한 번 따져본다",
    ],
    distinction:
      "판단력은 무엇이 맞는지 가려내는 힘이고, 신중함은 지금 해도 되는지를 재는 힘이에요.",
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
    long: '시험이나 필요 때문이 아니라, 아는 것이 늘어나는 즐거움으로 배워요. 호기심이 "알고 싶다"에 가깝다면 학구열은 "깊이 파고든다"에 가까워요.',
    viaDefinition:
      "새로운 것을 익히고 실력을 쌓는 과정 자체를 즐기는 힘. 이미 아는 분야를 더 깊이 파는 것도 포함한다.",
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
    nameKo: "통찰력",
    nameEn: "Perspective",
    alsoCalled: ["지혜"],
    virtue: "wisdom",
    order: 5,
    short: "큰 그림으로 조언해줘요",
    long: "아는 것이 많은 것과는 조금 달라요. 상황 전체를 넓게 보고, 다른 사람이 자기 문제를 이해하도록 도와주는 지혜예요. 사람들이 자연스럽게 조언을 구하러 찾아가는 사람이죠.",
    viaDefinition:
      "여러 관점과 겪은 일을 하나로 엮어 남에게 지혜로운 조언을 건네는 힘. VIA 는 이 강점을 '지혜'라고도 부른다.",
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
    nameKo: "용감함",
    nameEn: "Bravery",
    alsoCalled: ["용맹"],
    virtue: "courage",
    order: 6,
    short: "두려워도 옳은 일을 해요",
    long: "무섭지 않은 게 아니라, 무서워도 물러서지 않는 거예요. 위험 앞에서의 용기뿐 아니라 반대 의견을 말하거나 불편한 진실을 꺼내는 것도 용감함이에요.",
    viaDefinition:
      "두려움·위협·어려움 앞에서도 옳다고 믿는 바를 실제 행동으로 옮기는 힘. 몸의 위험만이 아니라 마음의 위험도 포함한다.",
    examples: [
      "다들 눈치를 볼 때 혼자서라도 아니라고 말한다",
      "말하기 껄끄러운 문제를 먼저 꺼내 놓는다",
      "손해를 볼 수 있는 자리에서도 자기 입장을 지킨다",
    ],
    distinction:
      "정직은 사실대로 말하는 것이고, 용감함은 그 말을 꺼내기 어려운 자리에서도 꺼내는 것이에요.",
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
    long: "중간에 힘들어지거나 지루해져도 마무리를 짓는 힘이에요. 걸림돌이 생겨도 계속 나아가고, 해냈을 때 그 기쁨을 알아요.",
    viaDefinition:
      "걸림돌과 실패가 있어도 목표를 향해 계속 나아가는 힘. VIA 는 이 강점을 '시작한 일을 끝내는 것'으로 설명한다.",
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
    nameKo: "정직",
    nameEn: "Honesty",
    alsoCalled: ["진정성", "성실성"],
    virtue: "courage",
    order: 8,
    short: "꾸미지 않고 진실하게 말해요",
    long: "거짓말을 하지 않는 것을 넘어, 자기 자신을 있는 그대로 드러내는 태도예요. 말과 행동이 같고 겉과 속이 다르지 않은 사람이죠.",
    viaDefinition:
      "자기를 있는 그대로 드러내고 자기 행동에 책임을 지는 힘. 거짓말을 안 하는 것보다 넓은 뜻이다.",
    examples: [
      "듣기 좋은 말 대신 사실대로 이야기해준다",
      "자기 실수를 감추지 않고 먼저 말한다",
      "사람에 따라 말을 바꾸지 않는다",
    ],
    distinction:
      "용감함이 두려움을 넘어서는 힘이라면, 정직은 겉과 속을 같게 두는 태도예요.",
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
    long: "무슨 일이든 대충 하지 않고 온몸으로 뛰어들어요. 그 사람이 있으면 자리의 공기가 달라지는, 그런 생기예요.",
    viaDefinition:
      "생기와 열의를 가지고 살아가는 힘. 무슨 일이든 반쯤 걸치지 않고 전부를 들여 한다.",
    examples: [
      "그 사람이 오면 분위기가 확 살아난다",
      "맡은 일을 대충 넘기지 않고 몸을 던져 한다",
      "지친 자리에서도 먼저 기운을 낸다",
    ],
    distinction: "희망은 앞날을 믿는 마음이고, 활력은 지금 이 자리에 쏟는 기운이에요.",
    confusableWith: ["hope"],
  },
  {
    code: "love",
    nameKo: "사랑",
    nameEn: "Love",
    alsoCalled: [],
    virtue: "humanity",
    order: 10,
    short: "가까운 사람과 깊이 이어져요",
    long: "사람과 가까워지는 것을 소중히 여기는 마음이에요. 주는 것뿐 아니라 받는 것도 편안하게 할 줄 아는 것까지 포함돼요.",
    viaDefinition:
      "사람과 가까이 지내는 것을 소중히 여기는 힘. 마음을 주는 쪽과 받는 쪽이 서로 오가는 관계를 뜻한다.",
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
    code: "kindness",
    nameKo: "친절",
    nameEn: "Kindness",
    alsoCalled: ["너그러움", "보살핌", "연민"],
    virtue: "humanity",
    order: 11,
    short: "먼저 챙기고 베풀어요",
    long: "부탁받지 않아도 다른 사람을 위해 움직이는 마음이에요. 돌아올 것을 기대하지 않고, 잘 모르는 사람에게도 마음을 열어둬요.",
    viaDefinition:
      "남을 돕고 마음을 헤아리며 대가 없이 베푸는 힘. 잘 모르는 사람에게까지 뻗는다.",
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
    code: "social_intelligence",
    nameKo: "사회지능",
    nameEn: "Social Intelligence",
    alsoCalled: ["정서지능"],
    virtue: "humanity",
    order: 12,
    short: "분위기와 마음을 잘 읽어요",
    long: "자기 감정과 다른 사람의 감정을 빠르게 알아차리고, 어떤 상황에서 어떻게 행동해야 할지 아는 감각이에요.",
    viaDefinition:
      "자기와 남의 감정·속마음을 알아차리는 힘. 알아차린 것에 맞춰 어떻게 처신할지 아는 것까지 포함한다.",
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
    long: "자기 몫을 충실히 하면서 팀 전체를 생각해요. 눈에 띄지 않는 자리에서도 성실하고, 속한 공동체에 충실한 힘이에요.",
    viaDefinition:
      "속한 무리의 일에 제 몫으로 기여하는 힘. VIA 는 시민의식·사회적 책임·충실함이라고도 부른다.",
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
    long: "친하다고 봐주거나 개인적인 감정으로 사람을 다르게 대하지 않아요. 모두에게 같은 기회가 돌아가는지 살피는 마음이에요.",
    viaDefinition:
      "모두를 같은 기준으로 대하는 힘. 개인적인 감정이 판단을 기울이지 않게 하고, 누구에게나 같은 기회를 준다.",
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
    long: "앞에서 지시하는 것보다, 함께 잘 굴러가게 만드는 힘에 가까워요. 사람들 사이의 관계를 좋게 유지하면서 일이 되게 해요.",
    viaDefinition:
      "무리가 할 일을 짜고 실제로 되게 만드는 힘. 그러면서 사람들 사이를 좋게 유지하는 것까지 포함한다.",
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
    long: "상처받은 일을 넘어가고 다시 기회를 주는 마음이에요. 되갚는 것보다 관계를 회복하는 쪽을 택해요.",
    viaDefinition:
      "잘못한 사람을 용서하고 앙갚음을 내려놓는 힘. 사람의 부족함을 받아들이고 다시 기회를 준다.",
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
    long: "자기를 낮추는 게 아니라, 자기를 부풀리지 않는 거예요. 잘한 일이 있어도 스스로 말하기보다 결과가 말하게 두는 태도죠.",
    viaDefinition:
      "해낸 일이 스스로 말하게 두는 힘. 자기 강점을 알면서도 주목받으려 애쓰지 않는다.",
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
    nameKo: "신중함",
    nameEn: "Prudence",
    alsoCalled: [],
    virtue: "temperance",
    order: 18,
    short: "나중을 생각하고 선택해요",
    long: "소심한 것과는 달라요. 나중에 후회할 말이나 행동을 미리 걸러내는 분별력이에요.",
    viaDefinition:
      "뒤에 올 일을 헤아려 조심스럽게 고르는 힘. 나중에 후회할 말과 행동을 미리 걸러낸다.",
    examples: [
      "충동적으로 말하기 전에 한 번 더 생각한다",
      "나중에 문제가 될 만한 것을 미리 짚어둔다",
      "급하게 정하자는 자리에서 한 박자 늦춘다",
    ],
    distinction:
      "판단력은 무엇이 맞는지 가리는 힘이고, 신중함은 지금 해도 되는지를 재는 힘이에요.",
    confusableWith: ["judgment"],
  },
  {
    code: "self_regulation",
    nameKo: "자기조절",
    nameEn: "Self-Regulation",
    alsoCalled: ["자기통제"],
    virtue: "temperance",
    order: 19,
    short: "감정과 습관을 스스로 다스려요",
    long: "화가 나거나 하고 싶은 것이 있어도 스스로를 붙잡을 수 있는 힘이에요. 정해둔 것을 꾸준히 지켜내는 것도 여기에 들어가요.",
    viaDefinition:
      "감정과 행동을 스스로 다스리는 힘. 정해둔 것을 꾸준히 지켜내는 규율까지 포함한다.",
    examples: [
      "화날 상황에서도 감정을 가라앉히고 차분히 대응한다",
      "하기로 정한 것을 기분과 상관없이 지킨다",
      "하고 싶은 것을 잠시 미뤄둘 줄 안다",
    ],
    distinction:
      "신중함은 하기 전에 재보는 힘이고, 자기조절은 이미 올라온 마음을 다스리는 힘이에요.",
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
    long: "자연이든 예술이든 사람의 훌륭함이든, 그 앞에서 잠시 멈춰 서서 감동할 줄 아는 마음이에요.",
    viaDefinition:
      "아름다움과 훌륭한 솜씨를 알아보고 마음이 움직이는 힘. 자연·예술·일상·사람의 뛰어남 어디에나 해당한다.",
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
    long: "좋은 일을 당연하게 여기지 않고 알아차려요. 마음에만 담아두지 않고 말로 전하는 것까지가 감사예요.",
    viaDefinition:
      "좋은 일을 알아차리고 고마워하는 힘. 마음에 담아두는 데서 그치지 않고 시간을 들여 전하는 것까지다.",
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
    long: "막연한 낙관이 아니라, 좋은 미래를 기대하고 그렇게 되도록 움직이는 힘이에요. 곁에 있는 사람까지 덩달아 기운이 나게 해요.",
    viaDefinition:
      "좋은 앞날을 기대하고 그렇게 되도록 움직이는 힘. 바라기만 하는 것이 아니라 그 방향으로 실제로 애쓴다.",
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
    nameKo: "유머",
    nameEn: "Humor",
    alsoCalled: ["유쾌함"],
    virtue: "transcendence",
    order: 23,
    short: "웃음을 만들어줘요",
    long: "장난기만 뜻하는 게 아니에요. 무거운 상황을 가볍게 만들어 사람들을 편안하게 해주는 능력이에요.",
    viaDefinition:
      "웃을 거리를 찾아내고 사람들에게 웃음을 가져다주는 힘. 장난기와 함께 상황의 가벼운 면을 보는 눈을 뜻한다.",
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
    long: "종교적인 믿음일 수도 있고, 삶이 어디로 향하는지에 대한 나름의 확신일 수도 있어요. 자기 삶을 더 큰 이야기 안에서 바라보는 태도예요.",
    viaDefinition:
      "삶에 목적과 의미가 있다고 느끼는 힘. 종교적 믿음일 수도 있고, 더 큰 무엇과 이어져 있다는 감각일 수도 있다.",
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
  strengths: readonly Strength[];
}> = VIRTUES.map((virtue) => ({
  virtue,
  meta: VIRTUE_META[virtue],
  strengths: STRENGTHS.filter((s) => s.virtue === virtue),
}));
