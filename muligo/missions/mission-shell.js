(function () {
  const electricState = {
    magnetSwapped: false,
    currentReversed: false
  };

  const CONFIGS = {
    "궤도 올리기.html": {
      id: "orbit-raise",
      place: "과학실",
      title: "궤도 올리기",
      intro: "속도와 각도를 조절해 운동 상태를 확인하세요. 조건을 만족해야 다음 단계가 열립니다.",
      themeColor: "#ff4020",
      themeRgb:   "255, 64, 32",
      themeDark:  "#b82010",
      steps: [
        {
          title: "저속 발사 관찰",
          body: "속도를 낮게 설정해 위성이 안정 궤도에 오르지 못하는 상태를 확인한다.",
          check: () => textOf("#stageBadge").includes("단계 1"),
          hint: "속도 슬라이더를 낮은 값으로 둔 상태를 만들어 보세요."
        },
        {
          title: "궤도 속도 접근",
          body: "속도를 올려 원궤도에 가까운 단계로 진입한다.",
          check: () => textOf("#stageBadge").includes("단계 2"),
          hint: "속도를 조금씩 올려 단계 표시가 2단계가 되게 해보세요."
        },
        {
          title: "탈출 조건 달성",
          body: "발사 결과가 중력권 탈출 성공으로 판정되게 한다.",
          check: () => document.querySelector(".result.good"),
          hint: "단계 3에 해당하는 속도로 발사해 성공 판정이 나오게 해보세요."
        }
      ],
      questions: [
        {
          prompt: "같은 행성에서 위성을 더 높은 고도에서 출발시키면, 같은 원궤도에 필요한 속도는 일반적으로 어떻게 변할까?",
          options: ["작아진다", "커진다", "고도와 무관하게 항상 같다", "탈출 속도와 같아진다"],
          answer: 0
        },
        {
          prompt: "발사 속도가 원궤도 속도보다는 크지만 탈출 속도보다는 작다면 가장 그럴듯한 운동은?",
          options: ["행성에 고정된다", "타원 궤도 또는 찌그러진 궤도로 움직인다", "반드시 직선으로 탈출한다", "중력이 0이 된다"],
          answer: 1
        },
        {
          prompt: "시뮬레이션에서 탈출 성공 판정이 나오는 핵심 조건은 어떤 물리량의 부호와 가장 관련이 깊을까?",
          options: ["총 역학적 에너지", "물체의 색", "발사 버튼을 누른 횟수", "행성 이미지의 크기"],
          answer: 0
        }
      ]
    },
    "렌즈의 굴절.html": {
      id: "lens-refraction",
      place: "도서관",
      title: "렌즈의 굴절",
      intro: "도전 모드에서 상의 종류와 크기를 판정해 빛의 경로를 복구하세요.",
      themeColor: "#4aaeff",
      themeRgb:   "74, 174, 255",
      themeDark:  "#1a70cc",
      steps: [
        {
          title: "도전 시작",
          body: "도전 버튼을 눌러 굴절 판단 문제를 시작한다.",
          check: () => numberOf("#lens-round") >= 1 || numberOf("#lens-score") > 0,
          hint: "도전 패널의 도전 버튼을 눌러 1라운드를 시작하세요."
        },
        {
          title: "굴절 판정 누적",
          body: "정답을 맞히며 150점 이상을 획득한다.",
          check: () => numberOf("#lens-score") >= 150,
          hint: "상 종류와 크기를 맞혀 점수를 150점 이상으로 올리세요."
        },
        {
          title: "복구 점수 달성",
          body: "최종 점수 350점 이상을 달성한다.",
          check: () => numberOf("#lens-score") >= 350,
          hint: "도전이 끝날 때까지 최대한 정답을 맞혀 350점 이상을 만들어야 합니다."
        }
      ],
      questions: [
        {
          prompt: "볼록렌즈에서 물체가 초점거리보다 멀리 있고 2배 초점거리보다 가까이 있으면, 상의 크기는 어떻게 판단하는 것이 가장 적절할까?",
          options: ["축소된 도립 실상", "확대된 도립 실상", "정립 허상", "상이 생기지 않음"],
          answer: 1
        },
        {
          prompt: "오목렌즈가 만드는 상을 판단할 때 가장 안정적으로 고를 수 있는 설명은?",
          options: ["항상 도립 실상이다", "대체로 정립 허상이며 물체보다 작다", "항상 물체보다 크다", "초점 밖에서만 생긴다"],
          answer: 1
        },
        {
          prompt: "도전 모드에서 상의 종류를 틀리기 쉬운 순간은 초점 부근이다. 그 이유로 가장 알맞은 것은?",
          options: ["상 위치가 급격하게 멀어지거나 판정이 민감해지기 때문이다", "렌즈가 더 이상 빛을 굴절시키지 않기 때문이다", "물체 높이가 0이 되기 때문이다", "초점에서는 항상 정립 허상만 생기기 때문이다"],
          answer: 0
        }
      ]
    },
    "전자기유도.html": {
      id: "electromagnetic-induction",
      place: "전기실",
      title: "전자기유도",
      intro: "전류, 자기장, 코일과 방향을 바꿔 유도 현상을 비교하세요. 단순 속도보다 조작 조건을 확인합니다.",
      themeColor: "#30ee78",
      themeRgb:   "48, 238, 120",
      themeDark:  "#10b850",
      setup: setupElectricTracking,
      steps: [
        {
          title: "장 세기 조정",
          body: "전류와 자기장을 충분히 높여 회전이 뚜렷하게 나타나는 조건을 만든다.",
          check: () => numberOf("#I_curr") >= 0.22 && numberOf("#B_field") >= 0.12,
          hint: "전류를 0.22A 이상, 자기장을 0.12T 이상으로 올려 보세요."
        },
        {
          title: "코일 구조 변경",
          body: "코일 개수를 늘려 같은 장에서 힘의 변화를 비교한다.",
          check: () => numberOf("#coilCount") >= 4,
          hint: "코일 개수를 4개로 바꿔 보세요."
        },
        {
          title: "방향 반전 비교",
          body: "자석 위치와 전류 방향을 모두 바꿔 힘의 방향 변화를 확인한다.",
          check: () => electricState.magnetSwapped && electricState.currentReversed,
          hint: "자석 위치 변경과 전류 방향 변경을 각각 한 번 이상 눌러 보세요."
        }
      ],
      questions: [
        {
          prompt: "코일의 회전 속도가 커질 때 유도 전류가 커지기 쉬운 이유로 가장 알맞은 것은?",
          options: ["자기 선속의 변화율이 커지기 때문이다", "저항이 항상 0이 되기 때문이다", "자석의 질량이 사라지기 때문이다", "전류 방향이 더 이상 바뀌지 않기 때문이다"],
          answer: 0
        },
        {
          prompt: "자석의 N극과 S극 위치를 바꾸면 유도 전류 방향 판단에서 무엇을 다시 확인해야 할까?",
          options: ["자기장의 방향", "코일의 색상", "그래프 배경색", "카메라 거리만"],
          answer: 0
        },
        {
          prompt: "렌츠 법칙 관점에서 유도 전류의 방향을 고르는 가장 좋은 기준은?",
          options: ["원인이 된 자기 선속 변화를 방해하는 방향", "항상 시계 방향", "항상 전원의 +극에서 -극 방향", "회전 속도와 무관한 임의 방향"],
          answer: 0
        }
      ]
    }
  };

  const filename = decodeURIComponent(location.pathname.split("/").pop());
  const config = CONFIGS[filename] || CONFIGS["궤도 올리기.html"];

  const challengeLevel = parseInt(new URLSearchParams(location.search).get('level') || '0');

  // ── 레벨별 퀴즈 문제 (레벨 1=index 0 ~ 레벨 5=index 4) ──────────────
  const CHALLENGE_QUESTIONS = {
    "궤도 올리기.html": [
      null, // lv1: 기존 문제 유지
      [
        { prompt: "원궤도 반지름이 4배가 되면 공전 주기는 몇 배가 되는가?", options: ["8배", "4배", "2배", "16배"], answer: 0 },
        { prompt: "저궤도 위성에 역방향 추력을 가하면 위성은 어떻게 되는가?", options: ["더 낮은 타원 궤도로 진입한다", "즉시 지면으로 낙하한다", "더 높은 궤도로 이동한다", "속도만 줄고 궤도는 유지된다"], answer: 0 },
        { prompt: "탈출 속도는 같은 고도의 원궤도 속도의 몇 배인가?", options: ["√2 배", "2 배", "√3 배", "1.5 배"], answer: 0 }
      ],
      [
        { prompt: "행성 반지름은 같고 질량이 2배가 되면 표면 탈출 속도는?", options: ["√2 배", "2 배", "4 배", "변화 없음"], answer: 0 },
        { prompt: "케플러 제2법칙(면적 속도 일정)과 가장 직접적으로 연결되는 보존 법칙은?", options: ["각운동량 보존", "역학적 에너지 보존", "선운동량 보존", "질량 보존"], answer: 0 },
        { prompt: "낮은 고도에서 발사한 위성이 같은 탈출 속도를 얻으려면 높은 고도에서 발사할 때보다 어떤가?", options: ["더 많은 에너지가 필요하다", "에너지가 덜 필요하다", "고도와 무관하다", "낮은 고도는 항상 원궤도만 된다"], answer: 0 }
      ],
      [
        { prompt: "타원 궤도에서 근지점과 원지점 중 속력이 더 빠른 곳은?", options: ["근지점 (행성에 가장 가까운 점)", "원지점 (행성에서 가장 먼 점)", "두 점에서 같다", "알 수 없다"], answer: 0 },
        { prompt: "원궤도 위성의 고도를 낮추려면?", options: ["역방향 추력으로 속도를 줄인다", "순방향 추력으로 속도를 높인다", "측면으로 추력을 가한다", "방법이 없다"], answer: 0 },
        { prompt: "원궤도를 도는 위성의 총 역학적 에너지(KE + PE)의 부호는?", options: ["음수", "양수", "0", "궤도마다 다르다"], answer: 0 }
      ],
      [
        { prompt: "대기 저항 없이 저궤도 원운동 중인 위성에 갑자기 역방향 추력을 가하면?", options: ["타원 궤도로 진입해 지표에 가까워진다", "즉시 자유 낙하한다", "더 높은 원궤도로 이동한다", "탈출 속도를 얻는다"], answer: 0 },
        { prompt: "정지위성(geostationary)의 각속도와 지구 자전 각속도의 관계는?", options: ["동일하다", "2배이다", "절반이다", "관계없다"], answer: 0 },
        { prompt: "실제 저궤도 위성은 이론과 달리 서서히 고도가 낮아진다. 주된 이유는?", options: ["잔류 대기 마찰로 에너지를 잃어 더 낮은 궤도로 이동한다", "태양풍이 위성을 끌어내린다", "달 인력이 점점 커진다", "연료 소모로 질량이 줄기 때문이다"], answer: 0 }
      ]
    ],
    "렌즈의 굴절.html": [
      null,
      [
        { prompt: "물체가 볼록렌즈의 2배 초점거리(2f)에 위치할 때 상은?", options: ["같은 크기의 도립 실상", "축소된 도립 실상", "확대된 도립 실상", "정립 허상"], answer: 0 },
        { prompt: "렌즈 방정식(1/f = 1/u + 1/v)에서 v가 음수이면 상의 종류는?", options: ["허상이다", "실상이다", "상이 생기지 않는다", "배율이 0이다"], answer: 0 },
        { prompt: "실상과 허상의 가장 중요한 차이는?", options: ["실상은 스크린에 맺힐 수 있고 허상은 맺힐 수 없다", "허상이 항상 크기가 더 크다", "크기 차이만 있을 뿐 같은 성질이다", "렌즈 종류에만 달려 있다"], answer: 0 }
      ],
      [
        { prompt: "오목렌즈에서 물체의 위치와 관계없이 항상 만들어지는 상의 특징은?", options: ["항상 정립 축소 허상", "항상 도립 실상", "물체 거리에 따라 실상·허상 전환", "초점 밖에서만 실상"], answer: 0 },
        { prompt: "볼록렌즈에서 배율 m = −v/u = −2 일 때 상의 특징은?", options: ["도립이며 물체의 2배 크기인 실상", "정립 2배 허상", "도립 1/2 배 실상", "허상 2배"], answer: 0 },
        { prompt: "두 개의 볼록렌즈를 밀착시켰을 때 합성 초점거리 f를 구하는 식은?", options: ["1/f = 1/f₁ + 1/f₂", "f = f₁ + f₂", "f = f₁×f₂ / (f₁+f₂)", "f = (f₁+f₂) / 2"], answer: 0 }
      ],
      [
        { prompt: "볼록렌즈의 초점 위에 물체를 놓으면?", options: ["상이 무한히 멀리 생긴다 (평행광)", "초점에 실상이 생긴다", "렌즈 뒤에 허상이 생긴다", "원래 위치에 상이 생긴다"], answer: 0 },
        { prompt: "카메라에서 가까운 피사체를 선명하게 찍으려면 렌즈를 어떻게 조정해야 하는가?", options: ["피사체 쪽으로 렌즈를 가까이 이동", "렌즈를 필름 쪽으로 이동", "이동 없이 조리개만 조절", "초점 거리를 줄인다"], answer: 0 },
        { prompt: "근시가 생기는 원인과 교정 방법은?", options: ["상이 망막 앞에 맺혀, 오목렌즈로 교정", "상이 망막 뒤에 맺혀, 볼록렌즈로 교정", "렌즈 굴절이 없어서, 수술로만 교정", "색수차 때문에, 특수렌즈로 교정"], answer: 0 }
      ],
      [
        { prompt: "굴절력(디옵터, D)의 정의와 오목렌즈의 굴절력 부호는?", options: ["D = 1/f(m), 오목렌즈는 음수", "D = f(m), 항상 양수", "D = f², 부호 없음", "D = 렌즈 두께"], answer: 0 },
        { prompt: "같은 유리 볼록렌즈를 물속에 넣으면 공기 중에서보다 초점거리는?", options: ["길어진다 (굴절이 약해진다)", "짧아진다 (굴절이 강해진다)", "변화 없다", "렌즈 두께에만 달려 있다"], answer: 0 },
        { prompt: "빛의 색(파장)에 따라 굴절률이 달라 초점이 어긋나는 현상(색수차)에서 가장 많이 굴절하는 색은?", options: ["보라색 (파장이 짧을수록 굴절 큼)", "빨간색", "노란색", "모두 동일하다"], answer: 0 }
      ]
    ],
    "전자기유도.html": [
      null,
      [
        { prompt: "패러데이 법칙 EMF = −dΦ/dt에서 음부호(−)의 물리적 의미는?", options: ["유도 기전력이 자기 선속 변화를 방해하는 방향으로 생긴다 (렌츠 법칙)", "전류 방향이 항상 음수", "에너지가 감소함을 나타낸다", "관례상 표기법일 뿐이다"], answer: 0 },
        { prompt: "코일 감은 수가 2배가 되면 유도 기전력은?", options: ["2배가 된다", "변화 없다", "4배가 된다", "절반이 된다"], answer: 0 },
        { prompt: "자석의 운동 속도가 2배 빨라지면 유도 기전력의 크기는?", options: ["2배가 된다", "변화 없다", "4배가 된다", "√2배가 된다"], answer: 0 }
      ],
      [
        { prompt: "코일 면적이 2배이고 감은 수도 2배이면, 같은 자석 속도에서 유도 기전력은?", options: ["4배", "2배", "1배 (변화 없음)", "8배"], answer: 0 },
        { prompt: "발전기와 전동기의 에너지 변환 방향으로 옳은 것은?", options: ["발전기: 역학→전기, 전동기: 전기→역학", "둘 다 전기→역학", "둘 다 역학→전기", "방향은 회전 속도에 따라 결정"], answer: 0 },
        { prompt: "코일 내부 자기 선속이 일정하게 유지된다면 유도 기전력은?", options: ["0 이다", "최대값을 유지한다", "방향만 계속 바뀐다", "계속 증가한다"], answer: 0 }
      ],
      [
        { prompt: "면적 A, 감은 수 N인 코일이 자기장 B 속에서 각속도 ω로 회전할 때 유도 기전력의 최댓값은?", options: ["NABω", "NAB/ω", "N²AB", "NABω²"], answer: 0 },
        { prompt: "자체 유도(self-inductance)가 발생하는 가장 근본적인 이유는?", options: ["코일 자신의 전류 변화가 자기장을 변화시켜 자신에게 기전력을 유도하기 때문", "외부 자석이 가까이 있기 때문", "저항이 변하기 때문", "전압원이 교류이기 때문"], answer: 0 },
        { prompt: "1차 코일 200회, 2차 코일 100회인 변압기에서 2차 전압은 1차 전압의?", options: ["절반 (1/2)", "2배", "동일", "4배"], answer: 0 }
      ],
      [
        { prompt: "교류 발전기에서 출력 전압이 정현파(사인곡선)인 이유는?", options: ["코일과 자기장이 이루는 각도가 균일하게 변해 선속 변화율이 sin 형태이기 때문", "전기 저항이 주기적으로 변하기 때문", "자기장 세기가 시간에 따라 변하기 때문", "발전기 구조상 출력이 항상 교류"], answer: 0 },
        { prompt: "전동기(motor)에서 역기전력(back-EMF)이 발생하는 이유와 효과는?", options: ["코일 회전으로 유도 전류가 생겨 입력 전류를 제한한다", "마찰이 전압을 낮추기 때문이다", "역기전력은 출력 전압을 높인다", "실제로 발생하지 않는 이상적 현상이다"], answer: 0 },
        { prompt: "변압기 철심을 얇은 규소 강판으로 적층하는 이유는?", options: ["와전류 경로를 끊어 저항을 높여 손실을 줄이기 위해", "자기장을 더 강하게 만들기 위해", "열을 더 잘 방출하기 위해", "무게를 줄이기 위해"], answer: 0 }
      ]
    ]
  };

  // ── 레벨별 단계 조건 오버라이드 ─────────────────────────────────────
  const CHALLENGE_STEP_OVERRIDES = {
    "렌즈의 굴절.html": [
      null,
      [null, { check: () => numberOf("#lens-score") >= 180, hint: "150점 → 180점 이상으로 올리세요." }, { check: () => numberOf("#lens-score") >= 380, hint: "LV.2 목표 점수는 380점입니다." }],
      [null, { check: () => numberOf("#lens-score") >= 210, hint: "210점 이상을 획득하세요." },         { check: () => numberOf("#lens-score") >= 410, hint: "LV.3 목표 점수는 410점입니다." }],
      [null, { check: () => numberOf("#lens-score") >= 250, hint: "250점 이상을 획득하세요." },         { check: () => numberOf("#lens-score") >= 450, hint: "LV.4 목표 점수는 450점입니다." }],
      [null, { check: () => numberOf("#lens-score") >= 300, hint: "300점 이상을 획득하세요." },         { check: () => numberOf("#lens-score") >= 480, hint: "LV.5 목표 점수는 480점(9개 이상 정답)입니다." }]
    ],
    "전자기유도.html": [
      null,
      [{ check: () => numberOf("#I_curr") >= 0.25 && numberOf("#B_field") >= 0.13, hint: "전류 0.25A 이상, 자기장 0.13T 이상으로 높이세요." }, null, null],
      [{ check: () => numberOf("#I_curr") >= 0.27 && numberOf("#B_field") >= 0.14, hint: "전류 0.27A 이상, 자기장 0.14T 이상으로 높이세요." }, null, null],
      [{ check: () => numberOf("#I_curr") >= 0.29 && numberOf("#B_field") >= 0.15, hint: "전류 0.29A 이상, 자기장 0.15T 이상으로 높이세요." }, null, { check: () => electricState.magnetSwapped && electricState.currentReversed && numberOf("#I_curr") >= 0.25, hint: "방향을 바꾸되 전류 0.25A 이상을 유지하세요." }],
      [{ check: () => numberOf("#I_curr") >= 0.30 && numberOf("#B_field") >= 0.15, hint: "전류 0.30A 이상, 자기장 0.15T 이상(최대)으로 높이세요." }, null, { check: () => electricState.magnetSwapped && electricState.currentReversed && numberOf("#I_curr") >= 0.28 && numberOf("#B_field") >= 0.14, hint: "방향을 바꾸면서 전류 0.28A, 자기장 0.14T 이상을 유지하세요." }]
    ]
  };

  if (challengeLevel >= 1) {
    const qs = CHALLENGE_QUESTIONS[filename]?.[challengeLevel - 1];
    if (qs) config.questions = qs;
    const overrides = CHALLENGE_STEP_OVERRIDES[filename]?.[challengeLevel - 1];
    if (overrides) overrides.forEach((ovr, i) => { if (ovr && config.steps[i]) Object.assign(config.steps[i], ovr); });
  }

  function textOf(selector) {
    return document.querySelector(selector)?.textContent?.trim() || "";
  }

  function numberOf(selector) {
    const element = document.querySelector(selector);
    const rawValue = element?.value ?? element?.textContent ?? "";
    const raw = String(rawValue).replace(/[^\d.-]/g, "");
    return Number.parseFloat(raw) || 0;
  }

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function setupElectricTracking() {
    const wire = () => {
      document.getElementById("btnMagnetSwap")?.addEventListener("click", () => {
        electricState.magnetSwapped = true;
      });
      document.getElementById("btnCurrentRev")?.addEventListener("click", () => {
        electricState.currentReversed = true;
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wire);
    } else {
      setTimeout(wire, 0);
    }
  }

  function wrapExistingContent(screen) {
    const keep = new Set(["SCRIPT", "STYLE", "LINK"]);
    Array.from(document.body.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && keep.has(node.tagName)) return;
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      screen.appendChild(node);
    });
  }

  function buildShell() {
    config.setup?.();
    document.body.classList.add("mgo-enhanced");

    // 미션별 테마 컬러 CSS 변수 주입
    const root = document.documentElement;
    root.style.setProperty("--mgo-theme",     config.themeColor || "#ff4020");
    root.style.setProperty("--mgo-theme-rgb", config.themeRgb   || "255, 64, 32");
    root.style.setProperty("--mgo-theme-dark",config.themeDark  || "#b82010");

    // 알람 배경 오버레이 주입
    const alarmBg = make("div", "mgo-alarm-bg");
    document.body.insertBefore(alarmBg, document.body.firstChild);

    const room = make("div", "mgo-room");
    const panel = make("aside", "mgo-panel");
    const board = make("main", "mgo-board-wrap");
    const screen = make("div", "mgo-screen");
    const quiz = make("section", "mgo-quiz");

    wrapExistingContent(screen);

    // 전자칠판 상단 크롬 바 — 2024 현대 디스플레이 스타일
    // 카메라 중앙, 브랜드 좌측, LED 우측
    const chromeTop = make("div", "mgo-chrome-top");
    chromeTop.innerHTML = `
      <span class="mgo-brand">MULIGO <em>INTERACTIVE</em></span>
      <div class="mgo-cam-area">
        <div class="mgo-cam"></div>
        <div class="mgo-mic-dot"></div>
        <div class="mgo-mic-dot"></div>
      </div>
      <div class="mgo-chrome-leds">
        <span class="mgo-led is-alert" title="ANOMALY ACTIVE"></span>
        <span class="mgo-led is-pwr" title="POWER ON"></span>
      </div>
    `;
    board.appendChild(chromeTop);
    board.appendChild(screen);

    // 전자칠판 하단 크롬 바 (시리얼 + 포트 + 상태)
    const chromeBot = make("div", "mgo-chrome-bot");
    chromeBot.innerHTML = `
      <span class="mgo-serial">SN: MGO-02-2024-KOR</span>
      <div class="mgo-port-row">
        <span class="mgo-port">HDMI</span>
        <span class="mgo-port">USB</span>
        <span class="mgo-port">LAN</span>
      </div>
      <span class="mgo-status-txt">⚠ ANOMALY DETECTED</span>
    `;
    board.appendChild(chromeBot);

    // 테두리 스캔 이펙트 + 스크린 스캔 하이라이트
    board.appendChild(make("div", "mgo-edge-scan"));
    screen.appendChild(make("div", "mgo-scan-run"));

    // 패널 상단 경보 배너
    const panelAlert = make("div", "mgo-panel-alert");
    panelAlert.innerHTML = `<span class="mgo-alert-pip"></span><span>이상현상 활성 — 대응 프로토콜 진행 중</span>`;
    panel.appendChild(panelAlert);

    // 패널 본문 컨테이너
    const panelBody = make("div", "mgo-panel-body");
    panelBody.appendChild(make("p", "mgo-kicker", `${config.place} 전자칠판`));
    panelBody.appendChild(make("h1", "", config.title));
    panelBody.appendChild(make("p", "", config.intro));

    const steps = make("div", "mgo-steps");
    const stepEls = config.steps.map((step, index) => {
      const row = make("div", "mgo-step");
      row.appendChild(make("div", "mgo-step-num", String(index + 1)));
      const copy = make("div");
      copy.appendChild(make("strong", "", step.title));
      copy.appendChild(make("span", "", step.body));
      row.appendChild(copy);
      steps.appendChild(row);
      return row;
    });
    panelBody.appendChild(steps);
    panel.appendChild(panelBody);

    // 패널 하단 고정 영역
    const panelFoot = make("div", "mgo-panel-foot");
    const status = make("div", "mgo-result", "");
    const action = make("button", "mgo-action", "1단계 조건 확인");
    const close = make("button", "mgo-action secondary", "복도로 돌아가기");
    panelFoot.appendChild(status);
    panelFoot.appendChild(action);
    panelFoot.appendChild(close);
    panel.appendChild(panelFoot);

    const card = make("div", "mgo-quiz-card");
    const quizTitle = make("h1", "", "최종 문제");
    const progress = make("p", "", "");
    const qBox = make("div", "mgo-question");
    const qText = make("strong", "", "");
    const opts = make("div", "mgo-options");
    const quizResult = make("div", "mgo-result");
    card.appendChild(make("p", "mgo-kicker", "최종 확인"));
    card.appendChild(quizTitle);
    card.appendChild(progress);
    qBox.appendChild(qText);
    qBox.appendChild(opts);
    card.appendChild(qBox);
    card.appendChild(quizResult);
    quiz.appendChild(card);

    room.appendChild(panel);
    room.appendChild(board);
    document.body.appendChild(room);
    document.body.appendChild(quiz);

    let currentStep = 0;
    action.addEventListener("click", () => {
      if (currentStep >= config.steps.length) {
        quiz.classList.add("show");
        renderQuestion(0);
        return;
      }

      const step = config.steps[currentStep];
      if (!step.check()) {
        status.textContent = step.hint;
        return;
      }

      status.textContent = `${currentStep + 1}단계 조건을 만족했습니다.`;
      stepEls[currentStep]?.classList.add("done");
      currentStep += 1;
      action.textContent = currentStep < config.steps.length
        ? `${currentStep + 1}단계 조건 확인`
        : "최종 문제 풀기";
    });

    function renderQuestion(index) {
      const q = config.questions[index];
      quizResult.textContent = "";
      quizTitle.textContent = `${index + 1}번 문제`;
      progress.textContent = `${index + 1} / ${config.questions.length}`;
      qText.textContent = q.prompt;
      opts.replaceChildren();

      const shuffled = q.options
        .map((text, i) => ({ text, correct: i === q.answer }))
        .sort(() => Math.random() - 0.5);

      shuffled.forEach(({ text, correct }) => {
        const btn = make("button", "mgo-option", text);
        btn.addEventListener("click", () => {
          if (!correct) {
            quizResult.textContent = "정답이 아닙니다. 시뮬레이션에서 관찰한 조건을 다시 떠올려 보세요.";
            return;
          }
          index < config.questions.length - 1 ? renderQuestion(index + 1) : completeMission();
        });
        opts.appendChild(btn);
      });
    }

    function completeMission() {
      quizTitle.textContent = "이상현상 해결 완료";
      progress.textContent = "";
      qText.textContent = "최종 문제를 모두 통과했습니다. 전자칠판 가장자리의 불안정 신호가 잦아듭니다.";
      opts.replaceChildren();
      document.body.classList.add("mgo-cleared");

      // 크롬 상태 업데이트
      const alertTxt = chromeBot.querySelector(".mgo-status-txt");
      if (alertTxt) alertTxt.textContent = "✓ ANOMALY NEUTRALIZED";
      const panelAlertSpan = panelAlert.querySelector("span:last-child");
      if (panelAlertSpan) panelAlertSpan.textContent = "이상현상 안정화 완료";

      window.parent.postMessage({ type: "muligo-mission-cleared", missionId: config.id }, "*");
      if (challengeLevel >= 1) {
        window.parent.postMessage({ type: "muligo-challenge-score", score: challengeLevel * 100 }, "*");
      }

      const back = make("button", "mgo-action", "복도로 돌아가기");
      back.addEventListener("click", () => window.parent.postMessage({ type: "muligo-close" }, "*"));
      opts.appendChild(back);
    }

    close.addEventListener("click", () => {
      window.parent.postMessage({ type: "muligo-close" }, "*");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildShell);
  } else {
    buildShell();
  }
})();
